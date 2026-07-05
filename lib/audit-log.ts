import { AuditActorType, AuditEvent, Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { logEvent } from "@/lib/observability"
import { buildAuditLogEntryHash, resolveAuditChainScope } from "@/lib/audit-chain"

type AuditLogInput = {
  tenantId?: string | null
  actorType: AuditActorType
  actorIdentifier?: string | null
  event: AuditEvent
  targetType: string
  targetId?: string | null
  requestId?: string | null
  ipAddress?: string | null
  metadata?: Prisma.InputJsonValue
}

const missingAuditTableLogState = {
  lastLoggedAt: 0,
}

type AuditLogWriter = Pick<typeof db, "auditLog">
type AuditLogTransactionalWriter = Pick<typeof db, "$executeRaw" | "$queryRaw">
type AuditLogRootWriter = Pick<typeof db, "auditLog" | "$queryRaw" | "$transaction">

function shouldTreatAsMissingAuditTable(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  )
}

async function createAuditLogRecord(input: AuditLogInput, client: AuditLogTransactionalWriter) {
  const chainScope = resolveAuditChainScope(input.tenantId)

  try {
    await client.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('audit_log_chain'), hashtext(${chainScope}))`

    const previousEntries = await client.$queryRaw<Array<{ entryHash: string | null }>>`
      SELECT "entryHash"
      FROM "AuditLog"
      WHERE "tenantId" IS NOT DISTINCT FROM ${input.tenantId ?? null}
      ORDER BY "createdAt" DESC, "id" DESC
      LIMIT 1
    `

    const createdAt = new Date()
    const prevHash = previousEntries[0]?.entryHash ?? null
    const entryHash = buildAuditLogEntryHash({
      tenantId: input.tenantId ?? null,
      actorType: input.actorType,
      actorIdentifier: input.actorIdentifier ?? null,
      event: input.event,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      requestId: input.requestId ?? null,
      ipAddress: input.ipAddress ?? null,
      metadata: input.metadata ?? null,
      createdAt,
      prevHash,
    })
    const metadataJson = input.metadata === undefined ? null : JSON.stringify(input.metadata)

    await client.$executeRaw(Prisma.sql`
      INSERT INTO "AuditLog" (
        "tenantId",
        "actorType",
        "actorIdentifier",
        "event",
        "targetType",
        "targetId",
        "requestId",
        "ipAddress",
        "metadata",
        "prevHash",
        "entryHash",
        "createdAt"
      ) VALUES (
        ${input.tenantId ?? null},
        ${input.actorType}::"AuditActorType",
        ${input.actorIdentifier ?? null},
        ${input.event}::"AuditEvent",
        ${input.targetType},
        ${input.targetId ?? null},
        ${input.requestId ?? null},
        ${input.ipAddress ?? null},
        ${metadataJson}::jsonb,
        ${prevHash},
        ${entryHash},
        ${createdAt}
      )
    `)
  } catch (error) {
    if (shouldTreatAsMissingAuditTable(error)) {
      const now = Date.now()

      if (now - missingAuditTableLogState.lastLoggedAt > 60_000) {
        missingAuditTableLogState.lastLoggedAt = now
        logEvent({
          level: "warn",
          event: "audit_log_table_missing",
          route: "audit-log",
          message: "Audit log table is not available yet.",
        })
      }

      return
    }

    logEvent({
      level: "error",
      event: "audit_log_write_failed",
      route: "audit-log",
      message: error instanceof Error ? error.message : "Unexpected audit log write error.",
      meta: {
        eventName: input.event,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
      },
    })
  }
}

export async function createAuditLog(input: AuditLogInput, client: AuditLogWriter = db) {
  if ("$transaction" in client && typeof client.$transaction === "function") {
    await (client as AuditLogRootWriter).$transaction(async (tx) => {
      await createAuditLogRecord(input, tx)
    })
    return
  }

  await createAuditLogRecord(input, client as unknown as AuditLogTransactionalWriter)
}

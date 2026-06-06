import { AuditActorType, AuditEvent, Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { logEvent } from "@/lib/observability"

type AuditLogInput = {
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

function shouldTreatAsMissingAuditTable(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  )
}

export async function createAuditLog(input: AuditLogInput) {
  try {
    await db.auditLog.create({
      data: {
        actorType: input.actorType,
        actorIdentifier: input.actorIdentifier ?? null,
        event: input.event,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        requestId: input.requestId ?? null,
        ipAddress: input.ipAddress ?? null,
        metadata: input.metadata,
      },
    })
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

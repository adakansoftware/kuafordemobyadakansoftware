import { createHash } from "node:crypto"
import type { AuditActorType, AuditEvent } from "@prisma/client"
import { getOptionalEnv } from "./env.ts"

type AuditChainRecord = {
  tenantId?: string | null
  actorType: AuditActorType
  actorIdentifier?: string | null
  event: AuditEvent
  targetType: string
  targetId?: string | null
  requestId?: string | null
  ipAddress?: string | null
  metadata?: unknown
  createdAt: Date
  prevHash?: string | null
}

export type AuditChainEntry = AuditChainRecord & {
  id: string
  entryHash?: string | null
}

function normalizeJsonValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return null
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeJsonValue(entry))
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, normalizeJsonValue(nestedValue)])
    )
  }

  if (typeof value === "number" && !Number.isFinite(value)) {
    return String(value)
  }

  return value
}

function stableStringify(value: unknown) {
  return JSON.stringify(normalizeJsonValue(value))
}

function getAuditChainSecret(secretOverride?: string) {
  const configured = secretOverride?.trim() || getOptionalEnv().APP_SECURITY_SECRET?.trim()
  return configured || "development-audit-chain-secret"
}

export function resolveAuditChainScope(tenantId?: string | null) {
  return tenantId?.trim() || "__global__"
}

export function buildAuditLogEntryHash(input: AuditChainRecord, secretOverride?: string) {
  const secret = getAuditChainSecret(secretOverride)

  return createHash("sha256")
    .update(secret)
    .update("|")
    .update(stableStringify({
      tenantId: input.tenantId ?? null,
      actorType: input.actorType,
      actorIdentifier: input.actorIdentifier ?? null,
      event: input.event,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      requestId: input.requestId ?? null,
      ipAddress: input.ipAddress ?? null,
      metadata: input.metadata ?? null,
      createdAt: input.createdAt.toISOString(),
      prevHash: input.prevHash ?? null,
    }))
    .digest("hex")
}

export function verifyAuditChainEntries(entries: AuditChainEntry[], secretOverride?: string) {
  let expectedPrevHash: string | null = null

  for (const entry of entries) {
    const computedHash = buildAuditLogEntryHash(
      {
        tenantId: entry.tenantId,
        actorType: entry.actorType,
        actorIdentifier: entry.actorIdentifier,
        event: entry.event,
        targetType: entry.targetType,
        targetId: entry.targetId,
        requestId: entry.requestId,
        ipAddress: entry.ipAddress,
        metadata: entry.metadata,
        createdAt: entry.createdAt,
        prevHash: entry.prevHash,
      },
      secretOverride
    )

    if ((entry.prevHash ?? null) !== expectedPrevHash || entry.entryHash !== computedHash) {
      return {
        ok: false,
        brokenAtId: entry.id,
      } as const
    }

    expectedPrevHash = entry.entryHash ?? null
  }

  return {
    ok: true,
    brokenAtId: null,
  } as const
}

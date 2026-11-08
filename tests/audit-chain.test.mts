import assert from "node:assert/strict"
import { AuditActorType, AuditEvent } from "@prisma/client"
import { buildAuditLogEntryHash, verifyAuditChainEntries } from "../lib/audit-chain.ts"

export function runAuditChainTests() {
  const secret = "audit-chain-test-secret"
  const createdAt = new Date("2026-07-05T09:30:00.000Z")

  const firstHash = buildAuditLogEntryHash(
    {
      tenantId: "tenant_1",
      actorType: AuditActorType.ADMIN,
      actorIdentifier: "owner",
      event: AuditEvent.ADMIN_USER_UPDATED,
      targetType: "admin_user",
      targetId: "admin_1",
      requestId: "req_1",
      ipAddress: "203.0.113.10",
      metadata: {
        action: "mfa_enabled",
        nested: {
          b: 2,
          a: 1,
        },
      },
      createdAt,
      prevHash: null,
    },
    secret
  )

  const secondHash = buildAuditLogEntryHash(
    {
      tenantId: "tenant_1",
      actorType: AuditActorType.ADMIN,
      actorIdentifier: "owner",
      event: AuditEvent.ADMIN_USER_UPDATED,
      targetType: "admin_user",
      targetId: "admin_1",
      requestId: "req_2",
      ipAddress: "203.0.113.10",
      metadata: {
        action: "sessions_revoked",
      },
      createdAt: new Date("2026-07-05T09:31:00.000Z"),
      prevHash: firstHash,
    },
    secret
  )

  assert.equal(
    verifyAuditChainEntries(
      [
        {
          id: "audit_1",
          tenantId: "tenant_1",
          actorType: AuditActorType.ADMIN,
          actorIdentifier: "owner",
          event: AuditEvent.ADMIN_USER_UPDATED,
          targetType: "admin_user",
          targetId: "admin_1",
          requestId: "req_1",
          ipAddress: "203.0.113.10",
          metadata: {
            nested: {
              a: 1,
              b: 2,
            },
            action: "mfa_enabled",
          },
          createdAt,
          prevHash: null,
          entryHash: firstHash,
        },
        {
          id: "audit_2",
          tenantId: "tenant_1",
          actorType: AuditActorType.ADMIN,
          actorIdentifier: "owner",
          event: AuditEvent.ADMIN_USER_UPDATED,
          targetType: "admin_user",
          targetId: "admin_1",
          requestId: "req_2",
          ipAddress: "203.0.113.10",
          metadata: {
            action: "sessions_revoked",
          },
          createdAt: new Date("2026-07-05T09:31:00.000Z"),
          prevHash: firstHash,
          entryHash: secondHash,
        },
      ],
      secret
    ).ok,
    true
  )

  assert.equal(
    verifyAuditChainEntries(
      [
        {
          id: "audit_1",
          tenantId: "tenant_1",
          actorType: AuditActorType.ADMIN,
          actorIdentifier: "owner",
          event: AuditEvent.ADMIN_USER_UPDATED,
          targetType: "admin_user",
          targetId: "admin_1",
          requestId: "req_1",
          ipAddress: "203.0.113.10",
          metadata: null,
          createdAt,
          prevHash: null,
          entryHash: firstHash,
        },
      ],
      secret
    ).ok,
    false
  )
}

import { test } from "vitest"

test("audit-chain suite", () => {
  runAuditChainTests()
})

import assert from "node:assert/strict"
import { isAdminSessionRevoked } from "../lib/admin-session-policy.ts"

export function runAdminSessionTests() {
  const createdAt = new Date("2026-07-04T09:00:00.000Z")

  assert.equal(
    isAdminSessionRevoked({
      sessionCreatedAt: createdAt,
      sessionRevokedAt: null,
    }),
    false
  )

  assert.equal(
    isAdminSessionRevoked({
      sessionCreatedAt: createdAt,
      sessionRevokedAt: new Date("2026-07-04T08:59:59.000Z"),
    }),
    false
  )

  assert.equal(
    isAdminSessionRevoked({
      sessionCreatedAt: createdAt,
      sessionRevokedAt: new Date("2026-07-04T09:00:00.000Z"),
    }),
    true
  )

  assert.equal(
    isAdminSessionRevoked({
      sessionCreatedAt: createdAt,
      sessionRevokedAt: new Date("2026-07-04T09:00:01.000Z"),
    }),
    true
  )
}

import { test } from "vitest"

test("admin-session suite", () => {
  runAdminSessionTests()
})

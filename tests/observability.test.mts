import assert from "node:assert/strict"
import { sanitizeLogMeta } from "../lib/observability.ts"

export function runObservabilityTests() {
  const sanitized = sanitizeLogMeta({
    email: "user@example.com",
    phone: "+905555555555",
    customerToken: "secret-token",
    notes: "a".repeat(260),
    nested: {
      authorization: "Bearer token",
      ok: true,
    },
    list: Array.from({ length: 25 }, (_, index) => index),
  })

  assert.equal(sanitized.email, "[redacted]")
  assert.equal(sanitized.phone, "[redacted]")
  assert.equal(sanitized.customerToken, "[redacted]")
  assert.equal(typeof sanitized.notes, "string")
  assert.equal((sanitized.notes as string).length, 240)
  assert.deepEqual(sanitized.nested, {
    authorization: "[redacted]",
    ok: true,
  })
  assert.equal(Array.isArray(sanitized.list), true)
  assert.equal((sanitized.list as unknown[]).length, 20)
}

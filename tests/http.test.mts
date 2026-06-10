import assert from "node:assert/strict"
import { getRequestIdFromHeaders, getRetryAfterSeconds } from "../lib/http-core.ts"

export function runHttpTests() {
  const generatedRequestId = getRequestIdFromHeaders(new Headers())
  assert.equal(typeof generatedRequestId, "string")
  assert.equal(generatedRequestId.length > 10, true)

  const explicitRequestId = getRequestIdFromHeaders(
    new Headers({
      "x-request-id": "  req-123  ",
    })
  )
  assert.equal(explicitRequestId, "req-123")

  const longRequestId = getRequestIdFromHeaders(
    new Headers({
      "x-request-id": "x".repeat(200),
    })
  )
  assert.equal(longRequestId.length, 120)
  assert.equal(getRetryAfterSeconds(65_000, 5_000), "60")
  assert.equal(getRetryAfterSeconds(5_000, 65_000), "0")
}

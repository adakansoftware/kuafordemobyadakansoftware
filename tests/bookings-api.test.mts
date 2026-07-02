import assert from "node:assert/strict"
import {
  buildRateLimitHeaders,
  getContentLength,
  parseBookingPayload,
  parseJsonText,
} from "../lib/bookings-api.ts"

export function runBookingsApiTests() {
  assert.deepEqual(
    buildRateLimitHeaders({
      remaining: -2,
      resetAt: 1_717_171_717_000,
      limit: 3,
    }),
    {
      "X-RateLimit-Limit": "3",
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": "1717171717",
    }
  )

  assert.equal(buildRateLimitHeaders(undefined), undefined)

  const payload = parseBookingPayload({
    service: "sac-kesim-tasarim",
    date: "2099-01-01",
    time: "10:00",
    name: "Ada Kan",
    phone: "+905399416521",
    email: "ada@example.com",
  })

  assert.deepEqual(payload, {
    service: "sac-kesim-tasarim",
    date: "2099-01-01",
    time: "10:00",
    name: "Ada Kan",
    phone: "+905399416521",
    email: "ada@example.com",
    website: "",
    formIssuedAt: "",
    formSignature: "",
    turnstileToken: "",
    clientFingerprint: "",
  })

  assert.equal(parseBookingPayload({ name: "Ada" }), null)
  assert.deepEqual(parseJsonText('{"ok":true}'), { ok: true })
  assert.equal(parseJsonText("{"), null)

  const request = new Request("https://example.com/api/bookings", {
    headers: {
      "content-length": "256",
    },
  })

  assert.equal(getContentLength(request), 256)

  const invalidRequest = new Request("https://example.com/api/bookings", {
    headers: {
      "content-length": "not-a-number",
    },
  })

  assert.equal(getContentLength(invalidRequest), 0)
}

import type { BookingFormDraft } from "./booking.ts"

export function buildRateLimitHeaders(rateLimit?: {
  remaining: number
  resetAt: number
  limit: number
}) {
  if (!rateLimit) {
    return undefined
  }

  return {
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(Math.max(rateLimit.remaining, 0)),
    "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
  }
}

export function parseBookingPayload(payload: unknown): BookingFormDraft | null {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const candidate = payload as Partial<Record<keyof BookingFormDraft, unknown>>

  if (
    typeof candidate.service !== "string" ||
    typeof candidate.date !== "string" ||
    typeof candidate.time !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.phone !== "string" ||
    typeof candidate.email !== "string"
  ) {
    return null
  }

  return {
    service: candidate.service,
    date: candidate.date,
    time: candidate.time,
    name: candidate.name,
    phone: candidate.phone,
    email: candidate.email,
    website: typeof candidate.website === "string" ? candidate.website : "",
  }
}

export function getContentLength(request: Request) {
  const raw = request.headers.get("content-length")
  const parsed = raw ? Number(raw) : 0
  return Number.isFinite(parsed) ? parsed : 0
}

export function parseJsonText(text: string) {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"

export type ApiSuccess<T> = {
  success: true
  data: T
}

export type ApiError<T extends Record<string, unknown> | undefined = undefined> = {
  success: false
  message: string
} & (T extends Record<string, unknown> ? T : Record<string, never>)

export function getRequestIdFromHeaders(headers: Headers) {
  const requestId = headers.get("x-request-id")?.trim()

  if (!requestId) {
    return randomUUID()
  }

  return requestId.slice(0, 120)
}

export function jsonNoStore(body: unknown, init?: ResponseInit & { requestId?: string }) {
  const response = NextResponse.json(body, init)
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("X-Robots-Tag", "noindex, nofollow")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  if (init?.requestId) {
    response.headers.set("X-Request-Id", init.requestId)
  }

  return response
}

import { randomUUID } from "node:crypto"

export function getRequestIdFromHeaders(headers: Headers) {
  const requestId = headers.get("x-request-id")?.trim()

  if (!requestId) {
    return randomUUID()
  }

  return requestId.slice(0, 120)
}

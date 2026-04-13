import { NextResponse } from "next/server"

export type ApiSuccess<T> = {
  success: true
  data: T
}

export type ApiError<T extends Record<string, unknown> | undefined = undefined> = {
  success: false
  message: string
} & (T extends Record<string, unknown> ? T : Record<string, never>)

export function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("X-Robots-Tag", "noindex, nofollow")
  return response
}

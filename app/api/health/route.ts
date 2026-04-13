import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

function jsonResponse(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("X-Robots-Tag", "noindex, nofollow")
  return response
}

export async function GET() {
  const startedAt = Date.now()

  try {
    await db.$queryRaw`SELECT 1`

    return jsonResponse({
      success: true,
      status: "ok",
      timestamp: new Date().toISOString(),
      checks: {
        database: "ok",
      },
      responseTimeMs: Date.now() - startedAt,
    })
  } catch {
    return jsonResponse(
      {
        success: false,
        status: "degraded",
        timestamp: new Date().toISOString(),
        checks: {
          database: "error",
        },
        responseTimeMs: Date.now() - startedAt,
      },
      { status: 503 }
    )
  }
}

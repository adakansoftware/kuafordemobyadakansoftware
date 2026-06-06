import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getEnvIssues, getOptionalEnv } from "@/lib/env"
import { buildHealthSummary } from "@/lib/health"
import { getDurationMs, logEvent } from "@/lib/observability"

export const dynamic = "force-dynamic"

function jsonResponse(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("X-Robots-Tag", "noindex, nofollow")
  return response
}

export async function GET() {
  const startedAt = Date.now()
  const optionalEnv = getOptionalEnv()
  const envIssues = getEnvIssues()
  const adminConfigured = Boolean(optionalEnv.ADMIN_USERNAME && optionalEnv.ADMIN_PASSWORD)
  const hasCanonicalUrl = Boolean(optionalEnv.NEXT_PUBLIC_SITE_URL)
  const allowedHostsConfigured = Boolean(optionalEnv.ALLOWED_ORIGIN_HOSTS || optionalEnv.NEXT_PUBLIC_SITE_URL)

  try {
    await db.$queryRaw`SELECT 1`

    const summary = buildHealthSummary({
      databaseOk: true,
      envIssues,
      hasCanonicalUrl,
      adminConfigured,
      allowedHostsConfigured,
    })

    logEvent({
      event: "health_check",
      route: "/api/health",
      message: "Health endpoint completed.",
      meta: {
        status: summary.status,
        responseTimeMs: getDurationMs(startedAt),
      },
    })

    return jsonResponse({
      success: true,
      status: summary.status,
      timestamp: new Date().toISOString(),
      checks: summary.checks,
      responseTimeMs: getDurationMs(startedAt),
    })
  } catch (error) {
    const summary = buildHealthSummary({
      databaseOk: false,
      envIssues,
      hasCanonicalUrl,
      adminConfigured,
      allowedHostsConfigured,
    })

    logEvent({
      level: "error",
      event: "health_check_failed",
      route: "/api/health",
      message: error instanceof Error ? error.message : "Unknown health error.",
      meta: {
        status: summary.status,
        responseTimeMs: getDurationMs(startedAt),
      },
    })

    return jsonResponse(
      {
        success: false,
        status: summary.status,
        timestamp: new Date().toISOString(),
        checks: summary.checks,
        responseTimeMs: getDurationMs(startedAt),
      },
      { status: 503 }
    )
  }
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getEnvIssues, getOptionalEnv } from "@/lib/env"
import { buildHealthSummary, type HealthScope } from "@/lib/health"
import { getDurationMs, logEvent } from "@/lib/observability"

export const dynamic = "force-dynamic"

function jsonResponse(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("X-Robots-Tag", "noindex, nofollow")
  return response
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const scope = url.searchParams.get("scope") === "live" ? "live" : "ready"
  return handleHealthRequest(scope)
}

export async function HEAD(request: Request) {
  const url = new URL(request.url)
  const scope = url.searchParams.get("scope") === "live" ? "live" : "ready"
  const response = await handleHealthRequest(scope)
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  })
}

async function checkTableAvailability(tableName: "RateLimitBucket" | "AuditLog") {
  try {
    await db.$queryRawUnsafe(`SELECT 1 FROM "${tableName}" LIMIT 1`)
    return true
  } catch {
    return false
  }
}

async function handleHealthRequest(scope: HealthScope) {
  const startedAt = Date.now()
  const optionalEnv = getOptionalEnv()
  const envIssues = getEnvIssues()
  const adminConfigured = Boolean(optionalEnv.ADMIN_USERNAME && optionalEnv.ADMIN_PASSWORD)
  const hasCanonicalUrl = Boolean(optionalEnv.NEXT_PUBLIC_SITE_URL)
  const allowedHostsConfigured = Boolean(optionalEnv.ALLOWED_ORIGIN_HOSTS || optionalEnv.NEXT_PUBLIC_SITE_URL)

  try {
    const [databaseOk, rateLimitStorageOk, auditLogStorageOk] = await Promise.all([
      db
        .$queryRaw`SELECT 1`
        .then(() => true)
        .catch(() => false),
      checkTableAvailability("RateLimitBucket"),
      checkTableAvailability("AuditLog"),
    ])

    const summary = buildHealthSummary({
      scope,
      databaseOk,
      envIssues,
      hasCanonicalUrl,
      adminConfigured,
      allowedHostsConfigured,
      rateLimitStorageOk,
      auditLogStorageOk,
    })

    logEvent({
      event: "health_check",
      route: "/api/health",
      message: "Health endpoint completed.",
      meta: {
        scope,
        status: summary.status,
        responseTimeMs: getDurationMs(startedAt),
      },
    })

    const statusCode = summary.status === "error" ? 503 : 200

    return jsonResponse(
      {
        success: summary.status !== "error",
        scope,
        status: summary.status,
        timestamp: new Date().toISOString(),
        checks: summary.checks,
        responseTimeMs: getDurationMs(startedAt),
      },
      { status: statusCode }
    )
  } catch (error) {
    const summary = buildHealthSummary({
      scope,
      databaseOk: false,
      envIssues,
      hasCanonicalUrl,
      adminConfigured,
      allowedHostsConfigured,
      rateLimitStorageOk: false,
      auditLogStorageOk: false,
    })

    logEvent({
      level: "error",
      event: "health_check_failed",
      route: "/api/health",
      message: error instanceof Error ? error.message : "Unknown health error.",
      meta: {
        scope,
        status: summary.status,
        responseTimeMs: getDurationMs(startedAt),
      },
    })

    return jsonResponse(
      {
        success: false,
        scope,
        status: summary.status,
        timestamp: new Date().toISOString(),
        checks: summary.checks,
        responseTimeMs: getDurationMs(startedAt),
      },
      { status: 503 }
    )
  }
}

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getEnvIssues, getOptionalEnv } from "@/lib/env"
import { authorizeAdminRequest } from "@/lib/security"
import { buildHealthSummary, resolveHealthScope, shouldExposeDetailedHealth, type HealthScope } from "@/lib/health"
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
  const scope = resolveHealthScope(url.searchParams.get("scope"))
  return handleHealthRequest(scope, request.headers)
}

export async function HEAD(request: Request) {
  const url = new URL(request.url)
  const scope = resolveHealthScope(url.searchParams.get("scope"))
  const response = await handleHealthRequest(scope, request.headers)
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  })
}

async function checkTableAvailability(tableName: "RateLimitBucket" | "AuditLog") {
  try {
    if (tableName === "RateLimitBucket") {
      await db.$queryRaw`SELECT 1 FROM "RateLimitBucket" LIMIT 1`
    } else {
      await db.$queryRaw`SELECT 1 FROM "AuditLog" LIMIT 1`
    }

    return true
  } catch {
    return false
  }
}

async function handleHealthRequest(scope: HealthScope, headers: Headers) {
  const startedAt = Date.now()
  const optionalEnv = getOptionalEnv()
  const envIssues = getEnvIssues()
  const adminConfigured = Boolean(optionalEnv.ADMIN_USERNAME && optionalEnv.ADMIN_PASSWORD)
  const hasCanonicalUrl = Boolean(optionalEnv.NEXT_PUBLIC_SITE_URL)
  const securitySecretConfigured = Boolean(optionalEnv.APP_SECURITY_SECRET && optionalEnv.APP_SECURITY_SECRET.length >= 24)
  const turnstileConfigured = Boolean(optionalEnv.TURNSTILE_SECRET_KEY && optionalEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  const adminAllowlistConfigured = Boolean(optionalEnv.ADMIN_ALLOWLIST_IPS)
  const allowedHostsConfigured = Boolean(optionalEnv.ALLOWED_ORIGIN_HOSTS || optionalEnv.NEXT_PUBLIC_SITE_URL)
  const canViewDetailedChecks = shouldExposeDetailedHealth(
    scope,
    authorizeAdminRequest(headers.get("authorization"))
  )

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
      securitySecretConfigured,
      turnstileConfigured,
      adminAllowlistConfigured,
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
        ...(canViewDetailedChecks ? { checks: summary.checks } : {}),
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
      securitySecretConfigured,
      turnstileConfigured,
      adminAllowlistConfigured,
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
        ...(canViewDetailedChecks ? { checks: summary.checks } : {}),
        responseTimeMs: getDurationMs(startedAt),
      },
      { status: 503 }
    )
  }
}

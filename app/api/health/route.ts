import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getEnvIssues, getOptionalEnv } from "@/lib/env"
import { getRetryAfterSeconds } from "@/lib/http-core"
import { applyRateLimit } from "@/lib/rate-limit"
import { blockTemporarily, getTemporaryBlock, recordSuspicion } from "@/lib/request-security"
import { authorizeAdminRequest } from "@/lib/security"
import { getRequestIpFromHeaders } from "@/lib/security"
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
  const ipAddress = getRequestIpFromHeaders(headers)
  const healthToken = headers.get("x-health-token")?.trim()
  const envIssues = getEnvIssues()
  const adminConfigured = Boolean(optionalEnv.ADMIN_USERNAME && optionalEnv.ADMIN_PASSWORD)
  const hasCanonicalUrl = Boolean(optionalEnv.NEXT_PUBLIC_SITE_URL)
  const securitySecretConfigured = Boolean(optionalEnv.APP_SECURITY_SECRET && optionalEnv.APP_SECURITY_SECRET.length >= 24)
  const healthTokenConfigured = Boolean(optionalEnv.HEALTHCHECK_TOKEN && optionalEnv.HEALTHCHECK_TOKEN.length >= 24)
  const turnstileConfigured = Boolean(optionalEnv.TURNSTILE_SECRET_KEY && optionalEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  const adminAllowlistConfigured = Boolean(optionalEnv.ADMIN_ALLOWLIST_IPS)
  const allowedHostsConfigured = Boolean(optionalEnv.ALLOWED_ORIGIN_HOSTS || optionalEnv.NEXT_PUBLIC_SITE_URL)
  const isHealthTokenAuthorized = Boolean(
    optionalEnv.HEALTHCHECK_TOKEN &&
      healthToken &&
      optionalEnv.HEALTHCHECK_TOKEN === healthToken
  )
  const isAuthorized = authorizeAdminRequest(headers.get("authorization")) || isHealthTokenAuthorized
  const canViewDetailedChecks = shouldExposeDetailedHealth(
    scope,
    isAuthorized
  )
  const rateLimit = await applyRateLimit({
    namespace: `health:${scope}`,
    key: `${ipAddress}:${scope}`,
    limit: scope === "live" ? 30 : 10,
    windowMs: 60_000,
  })

  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        success: false,
        scope,
        status: "error",
        timestamp: new Date().toISOString(),
        message: "Health endpoint gecici olarak sinirlandi.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": getRetryAfterSeconds(rateLimit.resetAt),
          "X-Health-Scope": scope,
        },
      }
    )
  }

  if (scope === "ready") {
    const blockState = await getTemporaryBlock("health-ready", ipAddress)

    if (blockState && blockState.resetAt > Date.now()) {
      return jsonResponse(
        {
          success: false,
          scope,
          status: "error",
          timestamp: new Date().toISOString(),
          message: "Readiness endpoint erisimi gecici olarak engellendi.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": getRetryAfterSeconds(blockState.resetAt),
            "X-Health-Scope": scope,
          },
        }
      )
    }

    if (!isAuthorized) {
      const accumulatedScore = await recordSuspicion({
        scope: "health-ready",
        clientKey: ipAddress,
        score: 4,
        route: "/api/health",
        reason: "Unauthorized readiness probe attempted.",
        audit: true,
      })

      if (accumulatedScore >= 8) {
        await blockTemporarily("health-ready", ipAddress, 30 * 60_000)
      }

      return jsonResponse(
        {
          success: false,
          scope,
          status: "error",
          timestamp: new Date().toISOString(),
          message: "Readiness endpoint icin ek yetkilendirme gereklidir.",
        },
        {
          status: 403,
          headers: {
            "X-Health-Scope": scope,
          },
        }
      )
    }
  }

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
      healthTokenConfigured,
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
      {
        status: statusCode,
        headers: {
          "X-Health-Scope": scope,
        },
      }
    )
  } catch (error) {
    const summary = buildHealthSummary({
      scope,
      databaseOk: false,
      envIssues,
      hasCanonicalUrl,
      adminConfigured,
      securitySecretConfigured,
      healthTokenConfigured,
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
      {
        status: 503,
        headers: {
          "X-Health-Scope": scope,
        },
      }
    )
  }
}

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getRequestIdFromHeaders } from "@/lib/http"
import { getRetryAfterSeconds } from "@/lib/http-core"
import { getDurationMs, logEvent } from "@/lib/observability"
import { blockTemporarily, getTemporaryBlock, recordSuspicion } from "@/lib/request-security"
import { applyRateLimit } from "@/lib/rate-limit"
import {
  authorizeAdminRequest,
  getAdminAllowlistIps,
  getAdminBasicAuthHeader,
  getRequestIpFromHeaders,
  getBasicAuthUsername,
  isIpAllowed,
} from "@/lib/security"

function getBaseHeaders(requestId: string) {
  return {
    "Cache-Control": "no-store",
    Vary: "Authorization",
    "X-Content-Type-Options": "nosniff",
    "X-Request-Id": requestId,
  }
}

function buildRateLimitHeaders(rateLimit?: {
  remaining: number
  resetAt: number
  limit: number
}): Record<string, string> {
  if (!rateLimit) {
    return {}
  }

  return {
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(Math.max(rateLimit.remaining, 0)),
    "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
  }
}

export async function proxy(request: NextRequest) {
  const startedAt = Date.now()
  const requestId = getRequestIdFromHeaders(request.headers)
  const ip = getRequestIpFromHeaders(request.headers)

  if (["TRACE", "TRACK"].includes(request.method)) {
    return new NextResponse("Method not allowed", {
      status: 405,
      headers: getBaseHeaders(requestId),
    })
  }

  if (request.nextUrl.search.length > 512) {
    return new NextResponse("Request URI too long", {
      status: 414,
      headers: getBaseHeaders(requestId),
    })
  }

  if (!request.nextUrl.pathname.startsWith("/admin")) {
    const response = NextResponse.next()
    response.headers.set("X-Request-Id", requestId)
    return response
  }

  try {
    if (!["GET", "HEAD", "POST"].includes(request.method)) {
      logEvent({
        level: "warn",
        event: "admin_proxy_method_blocked",
        requestId,
        route: request.nextUrl.pathname,
        message: "Admin proxy blocked unsupported HTTP method.",
        meta: {
          method: request.method,
          responseTimeMs: getDurationMs(startedAt),
        },
      })

      return new NextResponse("Method not allowed", {
        status: 405,
        headers: getBaseHeaders(requestId),
      })
    }

    const allowlist = getAdminAllowlistIps()

    if (!isIpAllowed(ip, allowlist)) {
      await recordSuspicion({
        scope: "admin-auth",
        clientKey: ip,
        score: 6,
        requestId,
        route: request.nextUrl.pathname,
        reason: "Admin access attempted from a non-allowlisted IP address.",
        audit: true,
      })

      return new NextResponse("Forbidden", {
        status: 403,
        headers: getBaseHeaders(requestId),
      })
    }

    const blockState = await getTemporaryBlock("admin-auth", ip)

    if (blockState && blockState.resetAt > Date.now()) {
      return new NextResponse("Too many authentication attempts", {
        status: 429,
        headers: {
          ...getBaseHeaders(requestId),
          "Retry-After": getRetryAfterSeconds(blockState.resetAt),
        },
      })
    }

    const authorized = authorizeAdminRequest(request.headers.get("authorization"))

    if (!authorized) {
      const authUsername = getBasicAuthUsername(request.headers.get("authorization")) ?? "unknown-user"
      const rateLimitConfig = {
        limit: 8,
        windowMs: 5 * 60 * 1000,
      }

      const attempt = await applyRateLimit({
        key: `${ip}:${authUsername}`,
        namespace: "admin-auth-attempts",
        ...rateLimitConfig,
      })

      if (!attempt.allowed) {
        logEvent({
          level: "warn",
          event: "admin_proxy_auth_rate_limited",
          requestId,
          route: request.nextUrl.pathname,
          message: "Admin authentication attempt was rate limited.",
          meta: {
            method: request.method,
            ip,
            rateLimitSource: attempt.source,
            responseTimeMs: getDurationMs(startedAt),
          },
        })

        await recordSuspicion({
          scope: "admin-auth",
          clientKey: ip,
          score: 5,
          requestId,
          route: request.nextUrl.pathname,
          reason: "Admin authentication attempts exceeded the configured rate limit.",
          meta: {
            authUsername,
          },
          audit: true,
        })
        await blockTemporarily("admin-auth", ip, 30 * 60_000)

        return new NextResponse("Too many authentication attempts", {
          status: 429,
          headers: {
            ...getBaseHeaders(requestId),
            ...buildRateLimitHeaders({ ...attempt, limit: rateLimitConfig.limit }),
            "Retry-After": getRetryAfterSeconds(attempt.resetAt),
          },
        })
      }

      logEvent({
        level: "warn",
        event: "admin_proxy_auth_challenge",
        requestId,
        route: request.nextUrl.pathname,
        message: "Admin proxy requested authentication.",
        meta: {
          method: request.method,
          ip,
          rateLimitSource: attempt.source,
          responseTimeMs: getDurationMs(startedAt),
        },
      })

      await recordSuspicion({
        scope: "admin-auth",
        clientKey: ip,
        score: 2,
        requestId,
        route: request.nextUrl.pathname,
        reason: "Admin authentication challenge issued for unauthorized request.",
        meta: {
          authUsername,
        },
        audit: true,
      })

      return new NextResponse("Authentication required", {
        status: 401,
        headers: {
          ...getBaseHeaders(requestId),
          ...buildRateLimitHeaders({ ...attempt, limit: rateLimitConfig.limit }),
          "WWW-Authenticate": getAdminBasicAuthHeader(),
        },
      })
    }

    const response = NextResponse.next()
    response.headers.set("Cache-Control", "no-store")
    response.headers.set("Vary", "Authorization")
    response.headers.set("X-Request-Id", requestId)
    response.headers.set("X-Content-Type-Options", "nosniff")

    logEvent({
      event: "admin_proxy_authorized",
      requestId,
      route: request.nextUrl.pathname,
      message: "Admin proxy authorized request.",
      meta: {
        method: request.method,
        responseTimeMs: getDurationMs(startedAt),
      },
    })

    return response
  } catch (error) {
    logEvent({
      level: "error",
      event: "admin_proxy_failed",
      requestId,
      route: request.nextUrl.pathname,
      message: error instanceof Error ? error.message : "Unexpected proxy error.",
      meta: {
        method: request.method,
        responseTimeMs: getDurationMs(startedAt),
      },
    })

    return new NextResponse("Service temporarily unavailable", {
      status: 503,
      headers: getBaseHeaders(requestId),
    })
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}

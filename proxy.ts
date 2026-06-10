import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getRequestIdFromHeaders } from "@/lib/http"
import { getRetryAfterSeconds } from "@/lib/http-core"
import { getDurationMs, logEvent } from "@/lib/observability"
import { applyRateLimit } from "@/lib/rate-limit"
import { authorizeAdminRequest, getAdminBasicAuthHeader, getRequestIpFromHeaders } from "@/lib/security"

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

    const ip = getRequestIpFromHeaders(request.headers)
    const authorized = authorizeAdminRequest(request.headers.get("authorization"))

    if (!authorized) {
      const rateLimitConfig = {
        limit: 8,
        windowMs: 5 * 60 * 1000,
      }

      const attempt = await applyRateLimit({
        key: ip,
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
  matcher: ["/admin/:path*"],
}

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { applyRateLimit } from "@/lib/rate-limit"
import { authorizeAdminRequest, getAdminBasicAuthHeader, getRequestIpFromHeaders } from "@/lib/security"

function getBaseHeaders() {
  return {
    "Cache-Control": "no-store",
    Vary: "Authorization",
  }
}

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  if (!["GET", "HEAD", "POST"].includes(request.method)) {
    return new NextResponse("Method not allowed", {
      status: 405,
      headers: getBaseHeaders(),
    })
  }

  const ip = getRequestIpFromHeaders(request.headers)
  const authorized = authorizeAdminRequest(request.headers.get("authorization"))

  if (!authorized) {
    const attempt = await applyRateLimit({
      key: ip,
      namespace: "admin-auth-attempts",
      limit: 8,
      windowMs: 5 * 60 * 1000,
    })

    if (!attempt.allowed) {
      return new NextResponse("Too many authentication attempts", {
        status: 429,
        headers: {
          ...getBaseHeaders(),
          "Retry-After": String(Math.ceil((attempt.resetAt - Date.now()) / 1000)),
        },
      })
    }

    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        ...getBaseHeaders(),
        "WWW-Authenticate": getAdminBasicAuthHeader(),
      },
    })
  }

  const response = NextResponse.next()
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("Vary", "Authorization")
  return response
}

export const config = {
  matcher: ["/admin/:path*"],
}

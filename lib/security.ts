import { headers } from "next/headers"
import { getEnv } from "./env.ts"
import {
  authorizeAdminRequest,
  getAllowedHosts,
  getAllowedOrigins,
  getRequestIpFromHeaders,
  isTrustedRequestOriginHeaders,
  normalizeHost,
  normalizeOrigin,
} from "./security-core.ts"

const ADMIN_REALM = "Adakan Admin"

export { authorizeAdminRequest, getAllowedHosts, getAllowedOrigins, getRequestIpFromHeaders, isTrustedRequestOriginHeaders, normalizeHost, normalizeOrigin }

export class AdminAccessError extends Error {
  constructor(message = "Yonetim alanina erisim izni bulunamadi.") {
    super(message)
    this.name = "AdminAccessError"
  }
}

export class RequestSecurityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RequestSecurityError"
  }
}

export function getAdminBasicAuthHeader() {
  return `Basic realm="${ADMIN_REALM}", charset="UTF-8"`
}

export function getSecurityHeaders() {
  const allowedOrigins = Array.from(getAllowedOrigins())
  const connectSources = ["'self'", ...allowedOrigins]

  return [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "img-src 'self' data: blob:",
        "font-src 'self' https://fonts.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "script-src 'self' 'unsafe-inline'",
        `connect-src ${connectSources.join(" ")}`,
        "frame-src 'self' https://www.google.com https://www.google.com.tr",
      ].join("; "),
    },
  ]
}

export async function requireAdminAccess() {
  const env = getEnv()

  if (!env.ADMIN_USERNAME?.trim() || !env.ADMIN_PASSWORD?.trim()) {
    throw new AdminAccessError("Admin erisimi icin ortam degiskenleri eksik.")
  }

  const requestHeaders = await headers()

  if (!authorizeAdminRequest(requestHeaders.get("authorization"))) {
    throw new AdminAccessError()
  }
}

export async function verifyTrustedOrigin(options: { allowHostFallback?: boolean } = {}) {
  const requestHeaders = await headers()

  if (!isTrustedRequestOriginHeaders(requestHeaders, options)) {
    throw new RequestSecurityError("Istek kaynagi dogrulanamadi.")
  }
}

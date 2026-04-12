import { timingSafeEqual } from "node:crypto"
import { headers } from "next/headers"
import { siteContent } from "@/lib/site-content"

const ADMIN_REALM = "Adakan Admin"

export class AdminAccessError extends Error {
  constructor(message = "Yönetim alanına erişim izni bulunamadı.") {
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

export function normalizeOrigin(value: string | null | undefined) {
  return value?.trim().replace(/\/$/, "") ?? ""
}

export function normalizeHost(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/:\d+$/, "") ?? ""
}

function extractHostFromOrigin(origin: string) {
  try {
    return normalizeHost(new URL(origin).host)
  } catch {
    return ""
  }
}

export function getAllowedOrigins() {
  return new Set(
    [siteContent.seo.siteUrl, process.env.NEXT_PUBLIC_SITE_URL?.trim()]
      .filter((value): value is string => Boolean(value))
      .map((value) => normalizeOrigin(value))
  )
}

export function getAllowedHosts() {
  const hosts = new Set(Array.from(getAllowedOrigins()).map(extractHostFromOrigin).filter(Boolean))
  const envHosts = (process.env.ALLOWED_ORIGIN_HOSTS ?? "")
    .split(",")
    .map((value) => normalizeHost(value))
    .filter(Boolean)

  for (const host of envHosts) {
    hosts.add(host)
  }

  return hosts
}

export function getRequestIpFromHeaders(input: Headers) {
  const forwardedFor = input.get("x-forwarded-for")

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown"
  }

  return input.get("x-real-ip")?.trim() ?? "unknown"
}

function isSameCredential(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

function decodeBasicAuth(value: string) {
  if (!value.startsWith("Basic ")) {
    return null
  }

  try {
    const decoded = Buffer.from(value.slice(6), "base64").toString("utf8")
    const separatorIndex = decoded.indexOf(":")

    if (separatorIndex === -1) {
      return null
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    }
  } catch {
    return null
  }
}

function hasAdminCredentialsConfigured() {
  return Boolean(process.env.ADMIN_USERNAME?.trim() && process.env.ADMIN_PASSWORD?.trim())
}

export function getAdminBasicAuthHeader() {
  return `Basic realm="${ADMIN_REALM}", charset="UTF-8"`
}

export function authorizeAdminRequest(authHeader: string | null) {
  if (!hasAdminCredentialsConfigured()) {
    return false
  }

  const credentials = authHeader ? decodeBasicAuth(authHeader) : null

  if (!credentials) {
    return false
  }

  return (
    isSameCredential(credentials.username, process.env.ADMIN_USERNAME?.trim() ?? "") &&
    isSameCredential(credentials.password, process.env.ADMIN_PASSWORD?.trim() ?? "")
  )
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

type TrustedOriginOptions = {
  allowHostFallback?: boolean
}

export function isTrustedRequestOriginHeaders(
  requestHeaders: Headers,
  options: TrustedOriginOptions = {}
) {
  const allowedOrigins = getAllowedOrigins()
  const allowedHosts = getAllowedHosts()
  const origin = normalizeOrigin(requestHeaders.get("origin"))
  const referer = requestHeaders.get("referer")
  const host = normalizeHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"))

  if (host && allowedHosts.size > 0 && !allowedHosts.has(host)) {
    return false
  }

  if (origin) {
    return allowedOrigins.has(origin)
  }

  if (referer) {
    try {
      return allowedOrigins.has(normalizeOrigin(new URL(referer).origin))
    } catch {
      return false
    }
  }

  return Boolean(options.allowHostFallback && host && allowedHosts.has(host))
}

export async function requireAdminAccess() {
  if (!hasAdminCredentialsConfigured()) {
    throw new AdminAccessError("Admin erişimi için ortam değişkenleri eksik.")
  }

  const requestHeaders = await headers()

  if (!authorizeAdminRequest(requestHeaders.get("authorization"))) {
    throw new AdminAccessError()
  }
}

export async function verifyTrustedOrigin(options: TrustedOriginOptions = {}) {
  const requestHeaders = await headers()

  if (!isTrustedRequestOriginHeaders(requestHeaders, options)) {
    throw new RequestSecurityError("İstek kaynağı doğrulanamadı.")
  }
}

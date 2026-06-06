import { timingSafeEqual } from "node:crypto"
import { getEnv } from "./env.ts"
import { siteContent } from "./site-content.ts"

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
  const env = getEnv()

  return new Set(
    [siteContent.seo.siteUrl, env.NEXT_PUBLIC_SITE_URL?.trim()]
      .filter((value): value is string => Boolean(value))
      .map((value) => normalizeOrigin(value))
  )
}

export function getAllowedHosts() {
  const env = getEnv()
  const hosts = new Set(Array.from(getAllowedOrigins()).map(extractHostFromOrigin).filter(Boolean))
  const envHosts = (env.ALLOWED_ORIGIN_HOSTS ?? "")
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
  const env = getEnv()
  return Boolean(env.ADMIN_USERNAME?.trim() && env.ADMIN_PASSWORD?.trim())
}

export function authorizeAdminRequest(authHeader: string | null) {
  const env = getEnv()

  if (!hasAdminCredentialsConfigured()) {
    return false
  }

  const credentials = authHeader ? decodeBasicAuth(authHeader) : null

  if (!credentials) {
    return false
  }

  return (
    isSameCredential(credentials.username, env.ADMIN_USERNAME?.trim() ?? "") &&
    isSameCredential(credentials.password, env.ADMIN_PASSWORD?.trim() ?? "")
  )
}

type TrustedOriginOptions = {
  allowHostFallback?: boolean
}

export function isTrustedRequestOriginHeaders(requestHeaders: Headers, options: TrustedOriginOptions = {}) {
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

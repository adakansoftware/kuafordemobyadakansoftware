import { timingSafeEqual } from "node:crypto"
import { getEnv } from "./env.ts"
import { getSiteUrlString } from "./site-url.ts"

export function normalizeOrigin(value: string | null | undefined) {
  return value?.trim().replace(/\/$/, "") ?? ""
}

export function normalizeHost(value: string | null | undefined) {
  const trimmed = value?.trim().toLowerCase() ?? ""

  if (!trimmed) {
    return ""
  }

  if (trimmed.startsWith("[")) {
    const closingIndex = trimmed.indexOf("]")
    return closingIndex === -1 ? trimmed : trimmed.slice(1, closingIndex)
  }

  const colonCount = (trimmed.match(/:/g) ?? []).length
  if (colonCount > 1) {
    return trimmed
  }

  return trimmed.replace(/:\d+$/, "")
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
  const canonicalSiteUrl = getSiteUrlString()

  return new Set(
    [canonicalSiteUrl, env.NEXT_PUBLIC_SITE_URL?.trim()]
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

function stripPortFromIp(value: string) {
  const trimmed = value.trim().replace(/^for=/i, "").replace(/^"|"$/g, "")

  if (!trimmed) {
    return ""
  }

  if (trimmed.startsWith("[")) {
    const closingIndex = trimmed.indexOf("]")
    return closingIndex === -1 ? trimmed : trimmed.slice(1, closingIndex)
  }

  const colonCount = (trimmed.match(/:/g) ?? []).length
  if (colonCount > 1) {
    return trimmed
  }

  return trimmed.replace(/:\d+$/, "")
}

function parseForwardedHeader(value: string | null) {
  if (!value) {
    return ""
  }

  const firstPart = value.split(",")[0] ?? ""
  const forToken = firstPart
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith("for="))

  return stripPortFromIp(forToken ?? "")
}

export function getRequestIpFromHeaders(input: Headers) {
  const prioritizedHeaders = [
    input.get("cf-connecting-ip"),
    input.get("true-client-ip"),
    input.get("x-real-ip"),
  ]

  for (const headerValue of prioritizedHeaders) {
    const normalized = stripPortFromIp(headerValue ?? "")

    if (normalized) {
      return normalized
    }
  }

  const forwardedFor = input.get("x-forwarded-for")

  if (forwardedFor) {
    const normalized = stripPortFromIp(forwardedFor.split(",")[0] ?? "")

    if (normalized) {
      return normalized
    }
  }

  const forwarded = parseForwardedHeader(input.get("forwarded"))

  if (forwarded) {
    return forwarded
  }

  return "unknown"
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

export function getBasicAuthUsername(authHeader: string | null) {
  return authHeader ? decodeBasicAuth(authHeader)?.username ?? null : null
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

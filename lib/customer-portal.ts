import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { getOptionalEnv } from "./env.ts"
import { peekRateLimitState, setRateLimitState } from "./rate-limit.ts"

const CUSTOMER_PORTAL_SESSION_NAMESPACE = "customer-portal-session"

export function normalizeCustomerPortalIdentifier(identifier: string) {
  const normalized = identifier.trim()

  if (!normalized) {
    return ""
  }

  if (normalized.includes("@")) {
    return normalized.toLowerCase()
  }

  return normalized.replace(/[^\d]/g, "")
}

export function getCustomerPortalSessionMaxAgeSeconds() {
  return 60 * 60 * 12
}

function getCustomerPortalSecret() {
  return getOptionalEnv().APP_SECURITY_SECRET?.trim() || "development-customer-portal-secret"
}

export function createCustomerPortalSessionValue(input: {
  customerId: string
  fingerprint: string
  expiresAt: number
  sessionId?: string
}) {
  const sessionId = input.sessionId ?? randomUUID()
  const payload = `${input.customerId}.${input.expiresAt}.${sessionId}.${input.fingerprint}`
  const signature = createHmac("sha256", getCustomerPortalSecret()).update(payload).digest("hex")
  return `${payload}.${signature}`
}

export function parseCustomerPortalSessionValue(
  value: string | undefined,
  fingerprint: string
): {
  customerId: string
  expiresAt: number
  sessionId: string
} | null {
  if (!value) {
    return null
  }

  const parts = value.split(".")

  if (parts.length < 4) {
    return null
  }

  const signature = parts.pop() ?? ""
  const [customerId, expiresAtRaw, sessionId, ...fingerprintParts] = parts
  const signedFingerprint = fingerprintParts.join(".")
  const payload = `${customerId}.${expiresAtRaw}.${sessionId}.${signedFingerprint}`
  const expectedSignature = createHmac("sha256", getCustomerPortalSecret()).update(payload).digest("hex")
  const expiresAt = Number(expiresAtRaw)

  if (!sessionId || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return null
  }

  if (signedFingerprint !== fingerprint) {
    return null
  }

  const left = Buffer.from(signature)
  const right = Buffer.from(expectedSignature)

  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null
  }

  return {
    customerId,
    expiresAt,
    sessionId,
  }
}

export async function registerCustomerPortalSession(input: {
  customerId: string
  sessionId: string
  expiresAt: number
}) {
  const windowMs = Math.max(input.expiresAt - Date.now(), 1_000)

  await setRateLimitState({
    namespace: CUSTOMER_PORTAL_SESSION_NAMESPACE,
    key: input.sessionId,
    count: 1,
    windowMs,
  })
}

export async function resolveCustomerPortalSession(input: {
  value: string | undefined
  fingerprint: string
}) {
  const parsed = parseCustomerPortalSessionValue(input.value, input.fingerprint)

  if (!parsed) {
    return null
  }

  const state = await peekRateLimitState({
    namespace: CUSTOMER_PORTAL_SESSION_NAMESPACE,
    key: parsed.sessionId,
  })

  if (!state || state.resetAt <= Date.now()) {
    return null
  }

  await registerCustomerPortalSession({
    customerId: parsed.customerId,
    sessionId: parsed.sessionId,
    expiresAt: parsed.expiresAt,
  })

  return parsed
}

import { createHmac, timingSafeEqual } from "node:crypto"
import { getOptionalEnv } from "./env.ts"

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
}) {
  const payload = `${input.customerId}.${input.expiresAt}.${input.fingerprint}`
  const signature = createHmac("sha256", getCustomerPortalSecret()).update(payload).digest("hex")
  return `${payload}.${signature}`
}

export function parseCustomerPortalSessionValue(
  value: string | undefined,
  fingerprint: string
): {
  customerId: string
  expiresAt: number
} | null {
  if (!value) {
    return null
  }

  const parts = value.split(".")

  if (parts.length < 4) {
    return null
  }

  const signature = parts.pop() ?? ""
  const [customerId, expiresAtRaw, ...fingerprintParts] = parts
  const signedFingerprint = fingerprintParts.join(".")
  const payload = `${customerId}.${expiresAtRaw}.${signedFingerprint}`
  const expectedSignature = createHmac("sha256", getCustomerPortalSecret()).update(payload).digest("hex")
  const expiresAt = Number(expiresAtRaw)

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
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
  }
}

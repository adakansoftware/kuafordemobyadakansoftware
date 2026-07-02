import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { getOptionalEnv } from "./env.ts"

const TOTP_STEP_SECONDS = 30
const TOTP_DIGITS = 6
const TOTP_WINDOW = 1
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

function getAppSecuritySecret() {
  return getOptionalEnv().APP_SECURITY_SECRET?.trim() || "development-admin-mfa-secret"
}

function buildSymmetricKey(purpose: string) {
  return createHash("sha256").update(`${purpose}:${getAppSecuritySecret()}`).digest()
}

function normalizeBase32(input: string) {
  return input.toUpperCase().replace(/[^A-Z2-7]/g, "")
}

function base32ToBuffer(input: string) {
  const normalized = normalizeBase32(input)
  let bits = ""

  for (const character of normalized) {
    const value = BASE32_ALPHABET.indexOf(character)

    if (value === -1) {
      throw new Error("Gecersiz MFA anahtari.")
    }

    bits += value.toString(2).padStart(5, "0")
  }

  const bytes: number[] = []

  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2))
  }

  return Buffer.from(bytes)
}

function bufferToBase32(input: Buffer) {
  let bits = ""

  for (const byte of input) {
    bits += byte.toString(2).padStart(8, "0")
  }

  let output = ""

  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, "0")
    output += BASE32_ALPHABET[Number.parseInt(chunk, 2)]
  }

  return output
}

function formatSecretForDisplay(secret: string) {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret
}

function hotp(secret: string, counter: number) {
  if (counter < 0) {
    return "".padStart(TOTP_DIGITS, "0")
  }

  const key = base32ToBuffer(secret)
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(BigInt(counter))
  const digest = createHmac("sha1", key).update(buffer).digest()
  const offset = digest[digest.length - 1] & 0x0f
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)

  return String(code % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0")
}

function normalizeTotpCode(code: string) {
  return code.replace(/\D/g, "").slice(0, TOTP_DIGITS)
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

export function generateTotpSecret() {
  const secret = bufferToBase32(randomBytes(20))

  return {
    secret,
    displaySecret: formatSecretForDisplay(secret),
  }
}

export function generateTotpCode(secret: string, at = Date.now()) {
  const counter = Math.floor(at / 1000 / TOTP_STEP_SECONDS)
  return hotp(secret, counter)
}

export function verifyTotpCode(input: {
  secret: string
  code: string
  at?: number
  window?: number
}) {
  const code = normalizeTotpCode(input.code)

  if (code.length !== TOTP_DIGITS) {
    return false
  }

  const at = input.at ?? Date.now()
  const counter = Math.floor(at / 1000 / TOTP_STEP_SECONDS)
  const window = input.window ?? TOTP_WINDOW

  for (let offset = -window; offset <= window; offset += 1) {
    const candidateCounter = counter + offset

    if (candidateCounter < 0) {
      continue
    }

    if (constantTimeEqual(hotp(input.secret, candidateCounter), code)) {
      return true
    }
  }

  return false
}

export function buildAdminTotpUri(input: {
  secret: string
  accountName: string
  tenantSlug: string
}) {
  const issuer = `Adakan Salon ${input.tenantSlug}`
  const label = `${issuer}:${input.accountName}`
  const query = new URLSearchParams({
    secret: input.secret,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  })

  return `otpauth://totp/${encodeURIComponent(label)}?${query.toString()}`
}

export function encryptAdminMfaSecret(secret: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", buildSymmetricKey("admin-mfa"), iv)
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`
}

export function decryptAdminMfaSecret(ciphertext: string) {
  const [ivValue, tagValue, payloadValue] = ciphertext.split(".")

  if (!ivValue || !tagValue || !payloadValue) {
    throw new Error("Kayitli MFA anahtari gecersiz.")
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    buildSymmetricKey("admin-mfa"),
    Buffer.from(ivValue, "base64url")
  )
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payloadValue, "base64url")),
    decipher.final(),
  ])

  return plaintext.toString("utf8")
}

export function createPendingMfaEnrollmentToken(input: {
  adminUserId: string
  tenantSlug: string
  username: string
}) {
  const { secret, displaySecret } = generateTotpSecret()
  const issuedAt = Date.now().toString()
  const payload = Buffer.from(JSON.stringify({
    adminUserId: input.adminUserId,
    tenantSlug: input.tenantSlug,
    username: input.username,
    secret,
    issuedAt,
  })).toString("base64url")
  const signature = createHmac("sha256", buildSymmetricKey("admin-mfa-enrollment"))
    .update(payload)
    .digest("base64url")

  return {
    enrollmentToken: `${payload}.${signature}`,
    secret,
    displaySecret,
    otpauthUri: buildAdminTotpUri({
      secret,
      accountName: input.username,
      tenantSlug: input.tenantSlug,
    }),
  }
}

export function resolvePendingMfaEnrollmentToken(input: {
  enrollmentToken: string
  adminUserId: string
  maxAgeMs?: number
}) {
  const [payload, signature] = input.enrollmentToken.split(".")

  if (!payload || !signature) {
    return null
  }

  const expectedSignature = createHmac("sha256", buildSymmetricKey("admin-mfa-enrollment"))
    .update(payload)
    .digest("base64url")

  if (!constantTimeEqual(signature, expectedSignature)) {
    return null
  }

  let decoded: {
    adminUserId: string
    tenantSlug: string
    username: string
    secret: string
    issuedAt: string
  }

  try {
    decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as typeof decoded
  } catch {
    return null
  }

  if (decoded.adminUserId !== input.adminUserId) {
    return null
  }

  const issuedAt = Number(decoded.issuedAt)
  const maxAgeMs = input.maxAgeMs ?? 15 * 60_000

  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > maxAgeMs) {
    return null
  }

  return decoded
}

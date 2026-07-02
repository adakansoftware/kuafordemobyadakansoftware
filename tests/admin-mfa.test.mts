import assert from "node:assert/strict"
import {
  buildAdminTotpUri,
  createPendingMfaEnrollmentToken,
  decryptAdminMfaSecret,
  encryptAdminMfaSecret,
  generateTotpCode,
  resolvePendingMfaEnrollmentToken,
  verifyTotpCode,
} from "../lib/admin-mfa.ts"

export function runAdminMfaTests() {
  const secret = "JBSWY3DPEHPK3PXP"
  const timestamp = 0
  const code = generateTotpCode(secret, timestamp)

  assert.equal(code, "282760")
  assert.equal(verifyTotpCode({ secret, code, at: timestamp }), true)
  assert.equal(verifyTotpCode({ secret, code: "000000", at: timestamp }), false)

  const ciphertext = encryptAdminMfaSecret(secret)
  assert.equal(decryptAdminMfaSecret(ciphertext), secret)

  const uri = buildAdminTotpUri({
    secret,
    accountName: "owner",
    tenantSlug: "default",
  })
  assert.equal(uri.startsWith("otpauth://totp/"), true)
  assert.equal(uri.includes("issuer="), true)

  const enrollment = createPendingMfaEnrollmentToken({
    adminUserId: "admin_1",
    tenantSlug: "default",
    username: "owner",
  })

  const resolved = resolvePendingMfaEnrollmentToken({
    enrollmentToken: enrollment.enrollmentToken,
    adminUserId: "admin_1",
  })

  assert.equal(Boolean(resolved?.secret), true)
  assert.equal(
    resolvePendingMfaEnrollmentToken({
      enrollmentToken: enrollment.enrollmentToken,
      adminUserId: "admin_2",
    }),
    null
  )
}

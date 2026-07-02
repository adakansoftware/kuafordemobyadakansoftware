import assert from "node:assert/strict"
import { buildHealthSummary, resolveHealthScope, shouldExposeDetailedHealth } from "../lib/health.ts"

export function runHealthTests() {
  assert.equal(resolveHealthScope("live"), "live")
  assert.equal(resolveHealthScope("ready"), "ready")
  assert.equal(resolveHealthScope("unexpected"), "ready")
  assert.equal(resolveHealthScope(null), "ready")
  assert.equal(shouldExposeDetailedHealth("live", true), false)
  assert.equal(shouldExposeDetailedHealth("ready", false), false)
  assert.equal(shouldExposeDetailedHealth("ready", true), true)

  const liveSummary = buildHealthSummary({
    scope: "live",
    databaseOk: true,
    envIssues: ["NEXT_PUBLIC_SITE_URL eksik."],
    hasCanonicalUrl: false,
    adminConfigured: false,
    securitySecretConfigured: false,
    healthTokenConfigured: false,
    turnstileConfigured: false,
    adminAllowlistConfigured: false,
    allowedHostsConfigured: false,
    rateLimitStorageOk: false,
    auditLogStorageOk: false,
  })

  assert.equal(liveSummary.status, "warn")

  const readinessErrorSummary = buildHealthSummary({
    scope: "ready",
    databaseOk: true,
    envIssues: [],
    hasCanonicalUrl: true,
    adminConfigured: true,
    securitySecretConfigured: true,
    healthTokenConfigured: true,
    turnstileConfigured: false,
    adminAllowlistConfigured: false,
    allowedHostsConfigured: true,
    rateLimitStorageOk: false,
    auditLogStorageOk: true,
  })

  assert.equal(readinessErrorSummary.status, "error")

  const readinessOkSummary = buildHealthSummary({
    scope: "ready",
    databaseOk: true,
    envIssues: [],
    hasCanonicalUrl: true,
    adminConfigured: true,
    securitySecretConfigured: true,
    healthTokenConfigured: true,
    turnstileConfigured: true,
    adminAllowlistConfigured: true,
    allowedHostsConfigured: true,
    rateLimitStorageOk: true,
    auditLogStorageOk: true,
  })

  assert.equal(readinessOkSummary.status, "ok")
}

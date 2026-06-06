import assert from "node:assert/strict"
import { buildHealthSummary } from "../lib/health.ts"

export function runHealthTests() {
  const liveSummary = buildHealthSummary({
    scope: "live",
    databaseOk: true,
    envIssues: ["NEXT_PUBLIC_SITE_URL eksik."],
    hasCanonicalUrl: false,
    adminConfigured: false,
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
    allowedHostsConfigured: true,
    rateLimitStorageOk: true,
    auditLogStorageOk: true,
  })

  assert.equal(readinessOkSummary.status, "ok")
}

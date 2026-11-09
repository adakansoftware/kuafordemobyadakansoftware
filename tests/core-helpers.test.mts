import assert from "node:assert/strict"
import { test } from "vitest"

import { getEnvIssues, resetEnvCacheForTests } from "../lib/env.ts"
import { buildHealthSummary } from "../lib/health.ts"
import {
  getAllowedHosts,
  getRequestIpFromHeaders,
  isTrustedRequestOriginHeaders,
  normalizeHost,
  normalizeOrigin,
} from "../lib/security-core.ts"

test("env rules", () => {
  process.env.DATABASE_URL = "postgresql://demo"
  process.env.NODE_ENV = "development"
  process.env.APP_SECURITY_SECRET = "very-strong-app-security-secret"
  process.env.ADMIN_USERNAME = "admin"
  delete process.env.ADMIN_PASSWORD
  resetEnvCacheForTests()
  assert.equal(getEnvIssues().includes("ADMIN_USERNAME ve ADMIN_PASSWORD birlikte tanımlanmalıdır."), true)

  process.env.ADMIN_PASSWORD = "short"
  resetEnvCacheForTests()
  assert.equal(getEnvIssues().includes("ADMIN_PASSWORD en az 12 karakter olmalıdır."), true)

  process.env.NODE_ENV = "production"
  delete process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.APP_SECURITY_SECRET
  delete process.env.ADMIN_USERNAME
  delete process.env.ADMIN_PASSWORD
  resetEnvCacheForTests()
  assert.equal(getEnvIssues().includes("Production ortamında NEXT_PUBLIC_SITE_URL zorunludur."), true)
})

test("security helpers", () => {
  process.env.DATABASE_URL = "postgresql://demo"
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.com"
  process.env.ADMIN_USERNAME = "admin-user"
  process.env.ADMIN_PASSWORD = "very-strong-pass"
  process.env.ALLOWED_ORIGIN_HOSTS = "api.example.com, booking.example.com"
  process.env.APP_SECURITY_SECRET = "very-strong-app-security-secret"
  process.env.NODE_ENV = "development"
  process.env.HEALTHCHECK_ALLOWLIST_IPS = "198.51.100.10"
  resetEnvCacheForTests()

  assert.equal(normalizeOrigin("https://example.com/"), "https://example.com")
  assert.equal(normalizeHost("Example.com:3000"), "example.com")
  assert.equal(normalizeHost("[2001:db8::1]:3000"), "2001:db8::1")

  const ipHeaders = new Headers({
    "x-forwarded-for": "203.0.113.10, 10.0.0.2",
    "x-real-ip": "198.51.100.1",
  })

  assert.equal(getRequestIpFromHeaders(ipHeaders), "198.51.100.1")

  const providerIpHeaders = new Headers({
    "cf-connecting-ip": "198.51.100.9",
    "x-forwarded-for": "203.0.113.10:443, 10.0.0.2",
  })

  assert.equal(getRequestIpFromHeaders(providerIpHeaders), "198.51.100.9")

  const forwardedHeaders = new Headers({
    forwarded: 'for="[2001:db8::1]:1234";proto=https',
  })

  assert.equal(getRequestIpFromHeaders(forwardedHeaders), "2001:db8::1")

  const allowedHosts = getAllowedHosts()
  assert.equal(allowedHosts.has("example.com"), true)
  assert.equal(allowedHosts.has("api.example.com"), true)
  assert.equal(allowedHosts.has("booking.example.com"), true)

  const trustedHeaders = new Headers({
    origin: "https://example.com",
    host: "example.com",
  })

  const untrustedHeaders = new Headers({
    origin: "https://example.com",
    host: "evil.example",
  })

  assert.equal(isTrustedRequestOriginHeaders(trustedHeaders), true)
  assert.equal(isTrustedRequestOriginHeaders(untrustedHeaders), false)
})

test("health summary", () => {
  const liveSummary = buildHealthSummary({
    scope: "live",
    databaseOk: true,
    envIssues: ["NEXT_PUBLIC_SITE_URL eksik."],
    hasCanonicalUrl: false,
    adminConfigured: true,
    securitySecretConfigured: true,
    healthTokenConfigured: false,
    turnstileConfigured: false,
    adminAllowlistConfigured: false,
    healthcheckAllowlistConfigured: false,
    allowedHostsConfigured: true,
    rateLimitStorageOk: false,
    auditLogStorageOk: false,
  })

  assert.equal(liveSummary.status, "warn")

  const readinessSummary = buildHealthSummary({
    scope: "ready",
    databaseOk: true,
    envIssues: [],
    hasCanonicalUrl: true,
    adminConfigured: true,
    securitySecretConfigured: true,
    healthTokenConfigured: true,
    turnstileConfigured: true,
    adminAllowlistConfigured: true,
    healthcheckAllowlistConfigured: true,
    allowedHostsConfigured: true,
    rateLimitStorageOk: true,
    auditLogStorageOk: false,
  })

  assert.equal(readinessSummary.status, "error")
})

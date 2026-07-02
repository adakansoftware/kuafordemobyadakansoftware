import assert from "node:assert/strict"

import { getEnvIssues, resetEnvCacheForTests } from "../lib/env.ts"
import { buildHealthSummary } from "../lib/health.ts"
import {
  getAllowedHosts,
  getRequestIpFromHeaders,
  isTrustedRequestOriginHeaders,
  normalizeHost,
  normalizeOrigin,
} from "../lib/security-core.ts"
import { runAdminAppointmentActionTests } from "../tests/admin-appointment-action.test.mts"
import { runBookingActionTests } from "../tests/booking-action.test.mts"
import { runBookingTests } from "../tests/booking.test.mts"
import { runBookingRouteTests } from "../tests/booking-route.test.mts"
import { runBookingsApiTests } from "../tests/bookings-api.test.mts"
import { runEnvTests } from "../tests/env.test.mts"
import { runHealthTests } from "../tests/health.test.mts"
import { runHttpTests } from "../tests/http.test.mts"
import { runObservabilityTests } from "../tests/observability.test.mts"
import { runOpsPreflightTests } from "../tests/ops-preflight.test.mts"
import { runRepositoryTests } from "../tests/repository.test.mts"
import { runSalonOpsTests } from "../tests/salon-ops.test.mts"
import { runSecurityTests } from "../tests/security.test.mts"
import { runSiteConfigTests } from "../tests/site-config.test.mts"
import { runTenantPlatformTests } from "../tests/tenant-platform.test.mts"

const originalEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ALLOWED_ORIGIN_HOSTS: process.env.ALLOWED_ORIGIN_HOSTS,
  APP_SECURITY_SECRET: process.env.APP_SECURITY_SECRET,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  ADMIN_ALLOWLIST_IPS: process.env.ADMIN_ALLOWLIST_IPS,
  SETUP_ACCESS_TOKEN: process.env.SETUP_ACCESS_TOKEN,
  NODE_ENV: process.env.NODE_ENV,
}

function restoreEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

  resetEnvCacheForTests()
}

function primeEnv() {
  process.env.DATABASE_URL = "postgresql://demo"
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.com"
  process.env.ADMIN_USERNAME = "admin-user"
  process.env.ADMIN_PASSWORD = "very-strong-pass"
  process.env.ALLOWED_ORIGIN_HOSTS = "api.example.com, booking.example.com"
  process.env.APP_SECURITY_SECRET = "very-strong-app-security-secret"
  process.env.NODE_ENV = "development"
  resetEnvCacheForTests()
}

function testEnvRules() {
  process.env.DATABASE_URL = "postgresql://demo"
  process.env.NODE_ENV = "development"
  process.env.APP_SECURITY_SECRET = "very-strong-app-security-secret"
  process.env.ADMIN_USERNAME = "admin"
  delete process.env.ADMIN_PASSWORD
  resetEnvCacheForTests()
  assert.equal(getEnvIssues().includes("ADMIN_USERNAME ve ADMIN_PASSWORD birlikte tanimlanmalidir."), true)

  process.env.ADMIN_PASSWORD = "short"
  resetEnvCacheForTests()
  assert.equal(getEnvIssues().includes("ADMIN_PASSWORD en az 12 karakter olmalidir."), true)

  process.env.NODE_ENV = "production"
  delete process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.APP_SECURITY_SECRET
  delete process.env.ADMIN_USERNAME
  delete process.env.ADMIN_PASSWORD
  resetEnvCacheForTests()
  assert.equal(getEnvIssues().includes("Production ortaminda NEXT_PUBLIC_SITE_URL zorunludur."), true)
}

function testSecurityHelpers() {
  primeEnv()

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
}

function testHealthSummary() {
  const liveSummary = buildHealthSummary({
    scope: "live",
    databaseOk: true,
    envIssues: ["NEXT_PUBLIC_SITE_URL eksik."],
    hasCanonicalUrl: false,
    adminConfigured: true,
    securitySecretConfigured: true,
    turnstileConfigured: false,
    adminAllowlistConfigured: false,
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
    turnstileConfigured: true,
    adminAllowlistConfigured: true,
    allowedHostsConfigured: true,
    rateLimitStorageOk: true,
    auditLogStorageOk: false,
  })

  assert.equal(readinessSummary.status, "error")
}

try {
  testEnvRules()
  testSecurityHelpers()
  testHealthSummary()
  runAdminAppointmentActionTests()
  runBookingActionTests()
  runBookingTests()
  runBookingRouteTests()
  runBookingsApiTests()
  runEnvTests()
  runHealthTests()
  runHttpTests()
  runObservabilityTests()
  runOpsPreflightTests()
  runRepositoryTests()
  runSalonOpsTests()
  runSecurityTests()
  runSiteConfigTests()
  runTenantPlatformTests()
  restoreEnv()
  console.log("Unit checks passed.")
} catch (error) {
  restoreEnv()
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

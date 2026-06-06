import assert from "node:assert/strict"

import { getEnvIssues, resetEnvCacheForTests } from "../lib/env.ts"
import {
  getAllowedHosts,
  getRequestIpFromHeaders,
  isTrustedRequestOriginHeaders,
  normalizeHost,
  normalizeOrigin,
} from "../lib/security-core.ts"

const originalEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ALLOWED_ORIGIN_HOSTS: process.env.ALLOWED_ORIGIN_HOSTS,
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
  process.env.NODE_ENV = "development"
  resetEnvCacheForTests()
}

function testEnvRules() {
  process.env.DATABASE_URL = "postgresql://demo"
  process.env.NODE_ENV = "development"
  process.env.ADMIN_USERNAME = "admin"
  delete process.env.ADMIN_PASSWORD
  resetEnvCacheForTests()
  assert.equal(getEnvIssues().includes("ADMIN_USERNAME ve ADMIN_PASSWORD birlikte tanimlanmalidir."), true)

  process.env.ADMIN_PASSWORD = "short"
  resetEnvCacheForTests()
  assert.equal(getEnvIssues().includes("ADMIN_PASSWORD en az 12 karakter olmalidir."), true)

  process.env.NODE_ENV = "production"
  delete process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.ADMIN_USERNAME
  delete process.env.ADMIN_PASSWORD
  resetEnvCacheForTests()
  assert.equal(getEnvIssues().includes("Production ortaminda NEXT_PUBLIC_SITE_URL zorunludur."), true)
}

function testSecurityHelpers() {
  primeEnv()

  assert.equal(normalizeOrigin("https://example.com/"), "https://example.com")
  assert.equal(normalizeHost("Example.com:3000"), "example.com")

  const ipHeaders = new Headers({
    "x-forwarded-for": "203.0.113.10, 10.0.0.2",
    "x-real-ip": "198.51.100.1",
  })

  assert.equal(getRequestIpFromHeaders(ipHeaders), "203.0.113.10")

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

try {
  testEnvRules()
  testSecurityHelpers()
  restoreEnv()
  console.log("Unit checks passed.")
} catch (error) {
  restoreEnv()
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

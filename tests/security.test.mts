import assert from "node:assert/strict"
import { resetEnvCacheForTests } from "../lib/env.ts"
import {
  getAllowedHosts,
  getAllowedOrigins,
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
  APP_SECURITY_SECRET: process.env.APP_SECURITY_SECRET,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  ADMIN_ALLOWLIST_IPS: process.env.ADMIN_ALLOWLIST_IPS,
  SETUP_ACCESS_TOKEN: process.env.SETUP_ACCESS_TOKEN,
  NODE_ENV: process.env.NODE_ENV,
}

function primeEnv() {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://demo"
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.com"
  process.env.ADMIN_USERNAME = "admin-user"
  process.env.ADMIN_PASSWORD = "very-strong-pass"
  process.env.ALLOWED_ORIGIN_HOSTS = "api.example.com, booking.example.com"
  process.env.APP_SECURITY_SECRET = "very-strong-app-security-secret"
  process.env.NODE_ENV = "development"
  resetEnvCacheForTests()
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

export function runSecurityTests() {
  assert.equal(normalizeOrigin("https://example.com/"), "https://example.com")
  assert.equal(normalizeHost("Example.com:3000"), "example.com")
  assert.equal(normalizeHost("[2001:db8::1]:3000"), "2001:db8::1")

  const forwardedHeaders = new Headers({
    "x-forwarded-for": "203.0.113.10, 10.0.0.2",
    "x-real-ip": "198.51.100.1",
  })
  assert.equal(getRequestIpFromHeaders(forwardedHeaders), "198.51.100.1")

  const providerHeaders = new Headers({
    "cf-connecting-ip": "198.51.100.9",
    "x-forwarded-for": "203.0.113.10:443, 10.0.0.2",
  })
  assert.equal(getRequestIpFromHeaders(providerHeaders), "198.51.100.9")

  const rfcForwardedHeaders = new Headers({
    forwarded: 'for="[2001:db8::1]:1234";proto=https',
  })
  assert.equal(getRequestIpFromHeaders(rfcForwardedHeaders), "2001:db8::1")

  primeEnv()

  const hosts = getAllowedHosts()
  assert.equal(hosts.has("example.com"), true)
  assert.equal(hosts.has("api.example.com"), true)
  assert.equal(hosts.has("booking.example.com"), true)
  assert.equal(hosts.has("adakan.studio"), false)

  const origins = getAllowedOrigins()
  assert.equal(origins.has("https://example.com"), true)
  assert.equal(origins.has("https://adakan.studio"), false)

  const trustedHeaders = new Headers({
    origin: "https://example.com",
    host: "example.com",
  })
  assert.equal(isTrustedRequestOriginHeaders(trustedHeaders), true)

  const untrustedHeaders = new Headers({
    origin: "https://example.com",
    host: "evil.example",
  })
  assert.equal(isTrustedRequestOriginHeaders(untrustedHeaders), false)

  const refererFallbackHeaders = new Headers({
    referer: "https://example.com/randevu",
    host: "example.com",
  })
  assert.equal(isTrustedRequestOriginHeaders(refererFallbackHeaders), true)

  const hostFallbackHeaders = new Headers({
    host: "booking.example.com",
  })
  assert.equal(isTrustedRequestOriginHeaders(hostFallbackHeaders), false)
  assert.equal(isTrustedRequestOriginHeaders(hostFallbackHeaders, { allowHostFallback: true }), true)

  restoreEnv()
}

import assert from "node:assert/strict"
import test from "node:test"
import { resetEnvCacheForTests } from "../lib/env.ts"
import {
  getAllowedHosts,
  getRequestIpFromHeaders,
  isTrustedRequestOriginHeaders,
  normalizeHost,
  normalizeOrigin,
} from "../lib/security.ts"

const originalEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ALLOWED_ORIGIN_HOSTS: process.env.ALLOWED_ORIGIN_HOSTS,
  NODE_ENV: process.env.NODE_ENV,
}

function primeEnv() {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://demo"
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.com"
  process.env.ADMIN_USERNAME = "admin-user"
  process.env.ADMIN_PASSWORD = "very-strong-pass"
  process.env.ALLOWED_ORIGIN_HOSTS = "api.example.com, booking.example.com"
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

test("normalizeOrigin trims trailing slash", () => {
  assert.equal(normalizeOrigin("https://example.com/"), "https://example.com")
})

test("normalizeHost trims port and lowercases", () => {
  assert.equal(normalizeHost("Example.com:3000"), "example.com")
})

test("getRequestIpFromHeaders prefers forwarded chain", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.10, 10.0.0.2",
    "x-real-ip": "198.51.100.1",
  })

  assert.equal(getRequestIpFromHeaders(headers), "203.0.113.10")
})

test("getAllowedHosts includes env hosts and public site host", () => {
  primeEnv()

  const hosts = getAllowedHosts()
  assert.equal(hosts.has("example.com"), true)
  assert.equal(hosts.has("api.example.com"), true)
  assert.equal(hosts.has("booking.example.com"), true)

  restoreEnv()
})

test("isTrustedRequestOriginHeaders accepts matching origin and host", () => {
  primeEnv()

  const headers = new Headers({
    origin: "https://example.com",
    host: "example.com",
  })

  assert.equal(isTrustedRequestOriginHeaders(headers), true)

  restoreEnv()
})

test("isTrustedRequestOriginHeaders rejects unrelated host", () => {
  primeEnv()

  const headers = new Headers({
    origin: "https://example.com",
    host: "evil.example",
  })

  assert.equal(isTrustedRequestOriginHeaders(headers), false)

  restoreEnv()
})

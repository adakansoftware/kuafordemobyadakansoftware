import { afterAll } from "vitest"
import { resetEnvCacheForTests } from "../lib/env.ts"

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
  HEALTHCHECK_ALLOWLIST_IPS: process.env.HEALTHCHECK_ALLOWLIST_IPS,
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
  process.env.HEALTHCHECK_ALLOWLIST_IPS = "198.51.100.10"
  resetEnvCacheForTests()
}

primeEnv()

afterAll(() => {
  restoreEnv()
})

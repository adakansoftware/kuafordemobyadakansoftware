import assert from "node:assert/strict"
import { getEnv, getEnvIssues, resetEnvCacheForTests } from "../lib/env.ts"

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
  HEALTHCHECK_TOKEN: process.env.HEALTHCHECK_TOKEN,
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

export function runEnvTests() {
  process.env.DATABASE_URL = "postgresql://demo"
  process.env.NODE_ENV = "development"
  process.env.APP_SECURITY_SECRET = "very-strong-app-security-secret"
  process.env.ADMIN_USERNAME = "admin"
  delete process.env.ADMIN_PASSWORD
  resetEnvCacheForTests()

  let issues = getEnvIssues()
  assert.equal(issues.includes("ADMIN_USERNAME ve ADMIN_PASSWORD birlikte tanimlanmalidir."), true)

  process.env.ADMIN_PASSWORD = "short"
  resetEnvCacheForTests()
  issues = getEnvIssues()
  assert.equal(issues.includes("ADMIN_PASSWORD en az 12 karakter olmalidir."), true)

  process.env.ADMIN_PASSWORD = "very-strong-pass"
  process.env.ALLOWED_ORIGIN_HOSTS = "https://example.com"
  resetEnvCacheForTests()
  issues = getEnvIssues()
  assert.equal(issues.includes("ALLOWED_ORIGIN_HOSTS sadece host isimleri icermelidir."), true)

  process.env.ALLOWED_ORIGIN_HOSTS = "booking.example.com"
  process.env.DATABASE_URL = "mysql://demo"
  resetEnvCacheForTests()
  issues = getEnvIssues()
  assert.equal(issues.includes("DATABASE_URL PostgreSQL baglantisi olmalidir."), true)

  process.env.NODE_ENV = "production"
  delete process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.APP_SECURITY_SECRET
  delete process.env.ADMIN_USERNAME
  delete process.env.ADMIN_PASSWORD
  delete process.env.HEALTHCHECK_TOKEN
  resetEnvCacheForTests()
  issues = getEnvIssues()
  assert.equal(issues.includes("Production ortaminda NEXT_PUBLIC_SITE_URL zorunludur."), true)
  assert.throws(() => getEnv(), /NEXT_PUBLIC_SITE_URL zorunludur/)

  process.env.NEXT_PUBLIC_SITE_URL = "https://example.com"
  process.env.APP_SECURITY_SECRET = "very-strong-app-security-secret"
  process.env.ADMIN_USERNAME = "admin"
  process.env.ADMIN_PASSWORD = "short"
  process.env.HEALTHCHECK_TOKEN = "short"
  resetEnvCacheForTests()
  assert.throws(() => getEnv(), /ADMIN_PASSWORD en az 12 karakter olmalidir/)

  process.env.ADMIN_PASSWORD = "very-strong-pass"
  resetEnvCacheForTests()
  assert.throws(() => getEnv(), /HEALTHCHECK_TOKEN en az 24 karakter olmalidir/)

  restoreEnv()
}

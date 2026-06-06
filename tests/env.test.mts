import assert from "node:assert/strict"
import test from "node:test"
import { getEnvIssues, resetEnvCacheForTests } from "../lib/env.ts"

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

test("getEnvIssues requires both admin credentials together", () => {
  process.env.DATABASE_URL = "postgresql://demo"
  process.env.NODE_ENV = "development"
  process.env.ADMIN_USERNAME = "admin"
  delete process.env.ADMIN_PASSWORD
  resetEnvCacheForTests()

  const issues = getEnvIssues()
  assert.equal(issues.includes("ADMIN_USERNAME ve ADMIN_PASSWORD birlikte tanimlanmalidir."), true)

  restoreEnv()
})

test("getEnvIssues requires strong admin password", () => {
  process.env.DATABASE_URL = "postgresql://demo"
  process.env.NODE_ENV = "development"
  process.env.ADMIN_USERNAME = "admin"
  process.env.ADMIN_PASSWORD = "short"
  resetEnvCacheForTests()

  const issues = getEnvIssues()
  assert.equal(issues.includes("ADMIN_PASSWORD en az 12 karakter olmalidir."), true)

  restoreEnv()
})

test("production requires public site url", () => {
  process.env.DATABASE_URL = "postgresql://demo"
  process.env.NODE_ENV = "production"
  delete process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.ADMIN_USERNAME
  delete process.env.ADMIN_PASSWORD
  resetEnvCacheForTests()

  const issues = getEnvIssues()
  assert.equal(issues.includes("Production ortaminda NEXT_PUBLIC_SITE_URL zorunludur."), true)

  restoreEnv()
})

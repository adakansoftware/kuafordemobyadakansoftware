import assert from "node:assert/strict"
import { collectPreflightWarnings, filterPreflightEnvIssues, resolvePreflightOptions } from "../lib/ops-preflight.ts"

export function runOpsPreflightTests() {
  assert.deepEqual(resolvePreflightOptions([]), { ci: false })
  assert.deepEqual(resolvePreflightOptions(["--ci"]), { ci: true })

  assert.deepEqual(
    collectPreflightWarnings(
      {
        DATABASE_URL: "postgresql://demo",
      },
      { ci: false }
    ),
    [
      "NEXT_PUBLIC_SITE_URL tanımlı değil.",
      "Admin kimlik bilgileri tam değil.",
      "DATABASE_URL örnek veya placeholder görünüyor.",
    ]
  )

  assert.deepEqual(
    collectPreflightWarnings(
      {
        DATABASE_URL: "postgresql://demo",
      },
      { ci: true }
    ),
    []
  )

  assert.deepEqual(
    collectPreflightWarnings(
      {
        DATABASE_URL: "postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require",
        NEXT_PUBLIC_SITE_URL: "https://example.com",
        ADMIN_USERNAME: "admin-user",
        ADMIN_PASSWORD: "change-this-password-now",
        ALLOWED_ORIGIN_HOSTS: "example.com,www.example.com",
      },
      { ci: false }
    ),
    [
      "DATABASE_URL örnek veya placeholder görünüyor.",
      "NEXT_PUBLIC_SITE_URL örnek bir alan adına işaret ediyor.",
      "ADMIN_PASSWORD varsayılan veya zayıf bir değer gibi görünüyor.",
      "ALLOWED_ORIGIN_HOSTS örnek host değerleri içeriyor.",
    ]
  )

  assert.deepEqual(filterPreflightEnvIssues(["DATABASE_URL tanımlanmalıdır."], { ci: false }), [
    "DATABASE_URL tanımlanmalıdır.",
  ])
  assert.deepEqual(filterPreflightEnvIssues(["DATABASE_URL tanımlanmalıdır."], { ci: true }), [])
}

import { test } from "vitest"

test("ops-preflight suite", () => {
  runOpsPreflightTests()
})

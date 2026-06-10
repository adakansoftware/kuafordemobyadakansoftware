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
      "NEXT_PUBLIC_SITE_URL tanimli degil.",
      "Admin kimlik bilgileri tam degil.",
      "DATABASE_URL ornek veya placeholder gorunuyor.",
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
      "DATABASE_URL ornek veya placeholder gorunuyor.",
      "NEXT_PUBLIC_SITE_URL ornek bir alan adina isaret ediyor.",
      "ADMIN_PASSWORD varsayilan veya zayif bir deger gibi gorunuyor.",
      "ALLOWED_ORIGIN_HOSTS ornek host degerleri iceriyor.",
    ]
  )

  assert.deepEqual(filterPreflightEnvIssues(["DATABASE_URL tanimlanmalidir."], { ci: false }), [
    "DATABASE_URL tanimlanmalidir.",
  ])
  assert.deepEqual(filterPreflightEnvIssues(["DATABASE_URL tanimlanmalidir."], { ci: true }), [])
}

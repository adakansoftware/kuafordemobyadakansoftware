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
    ["NEXT_PUBLIC_SITE_URL tanimli degil.", "Admin kimlik bilgileri tam degil."]
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
        DATABASE_URL: "postgresql://demo",
        NEXT_PUBLIC_SITE_URL: "https://example.com",
        ADMIN_USERNAME: "admin-user",
        ADMIN_PASSWORD: "very-strong-pass",
      },
      { ci: false }
    ),
    []
  )

  assert.deepEqual(filterPreflightEnvIssues(["DATABASE_URL tanimlanmalidir."], { ci: false }), [
    "DATABASE_URL tanimlanmalidir.",
  ])
  assert.deepEqual(filterPreflightEnvIssues(["DATABASE_URL tanimlanmalidir."], { ci: true }), [])
}

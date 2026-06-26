import assert from "node:assert/strict"
import { readdir, readFile } from "node:fs/promises"
import { findMissingDbHardeningIndexes } from "../lib/db-hardening.ts"

async function main() {
  const migrationsDir = new URL("../prisma/migrations/", import.meta.url)
  const entries = await readdir(migrationsDir, { withFileTypes: true })
  const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()

  assert.ok(directories.length > 0, "En az bir Prisma migration klasoru bulunmali.")

  const latestMigrationDir = directories[directories.length - 1]
  const latestMigrationPath = new URL(`../prisma/migrations/${latestMigrationDir}/migration.sql`, import.meta.url)
  const latestMigration = await readFile(latestMigrationPath, "utf8")
  const migrationLock = await readFile(new URL("../prisma/migrations/migration_lock.toml", import.meta.url), "utf8")
  const hardeningSql = await readFile(new URL("../prisma/hardening.sql", import.meta.url), "utf8")
  const missingHardeningIndexes = findMissingDbHardeningIndexes(hardeningSql)

  assert.ok(migrationLock.includes('provider = "postgresql"'), "Prisma migration lock provider postgresql olmali.")
  assert.ok(latestMigration.includes('CREATE TABLE "public"."RateLimitBucket"'), "RateLimitBucket migration icinde bulunmali.")
  assert.ok(latestMigration.includes('CREATE TABLE "public"."AuditLog"'), "AuditLog migration icinde bulunmali.")
  assert.equal(
    missingHardeningIndexes.length,
    0,
    `Hardening SQL beklenen indeksleri icermiyor: ${missingHardeningIndexes.join(", ")}`
  )

  console.log(`Migration check passed. Latest migration: ${latestMigrationDir}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

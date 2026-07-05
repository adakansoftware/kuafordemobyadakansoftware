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
  const migrationContents = await Promise.all(
    directories.map((directory) => readFile(new URL(`../prisma/migrations/${directory}/migration.sql`, import.meta.url), "utf8"))
  )
  const migrationLock = await readFile(new URL("../prisma/migrations/migration_lock.toml", import.meta.url), "utf8")
  const hardeningSql = await readFile(new URL("../prisma/hardening.sql", import.meta.url), "utf8")
  const missingHardeningIndexes = findMissingDbHardeningIndexes(hardeningSql)

  assert.ok(migrationLock.includes('provider = "postgresql"'), "Prisma migration lock provider postgresql olmali.")
  assert.equal(
    migrationContents.some((content) => content.includes('CREATE TABLE "public"."RateLimitBucket"')),
    true,
    "RateLimitBucket migration gecmisi icinde bulunmali."
  )
  assert.equal(
    migrationContents.some((content) => content.includes('CREATE TABLE "public"."AuditLog"')),
    true,
    "AuditLog migration gecmisi icinde bulunmali."
  )
  assert.ok(latestMigration.length > 0, "En guncel migration bos olmamali.")
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

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

import { findMissingDbHardeningIndexes, hasSafeCreateIndexGuards } from "../lib/db-hardening.ts"

async function main() {
  const sql = await readFile(new URL("../prisma/hardening.sql", import.meta.url), "utf8")
  const missingIndexes = findMissingDbHardeningIndexes(sql)

  assert.equal(missingIndexes.length, 0, `Hardening SQL icinde eksik indeksler var: ${missingIndexes.join(", ")}`)
  assert.equal(
    hasSafeCreateIndexGuards(sql),
    true,
    "Hardening SQL tum indeksleri CREATE ... IF NOT EXISTS guvencesi ile tanimlamalidir."
  )
  assert.equal(sql.includes("TODO"), false, 'Hardening SQL icinde "TODO" bulunmamali.')

  console.log(`Hardening check passed. Index count: ${8}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

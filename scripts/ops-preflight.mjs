import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { getEnvIssues, getOptionalEnv } from "../lib/env.ts"

async function loadEnvFile(relativePath) {
  try {
    const content = await readFile(new URL(relativePath, import.meta.url), "utf8")

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim()

      if (!line || line.startsWith("#")) {
        continue
      }

      const separatorIndex = line.indexOf("=")

      if (separatorIndex === -1) {
        continue
      }

      const key = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1).trim().replace(/^"(.*)"$/, "$1")

      if (!(key in process.env)) {
        process.env[key] = value
      }
    }
  } catch {
    return
  }
}

async function main() {
  await loadEnvFile("../.env")
  await loadEnvFile("../.env.local")

  const envIssues = getEnvIssues()

  if (envIssues.length > 0) {
    throw new Error(`Env preflight failed: ${envIssues.join(" | ")}`)
  }

  const env = getOptionalEnv()
  const warnings = []

  if (!env.NEXT_PUBLIC_SITE_URL) {
    warnings.push("NEXT_PUBLIC_SITE_URL tanimli degil.")
  }

  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    warnings.push("Admin kimlik bilgileri tam degil.")
  }

  const schema = await readFile(new URL("../prisma/schema.prisma", import.meta.url), "utf8")

  assert.ok(schema.includes("model RateLimitBucket"), "Prisma schema icinde RateLimitBucket modeli bulunmali.")
  assert.ok(schema.includes("model AuditLog"), "Prisma schema icinde AuditLog modeli bulunmali.")
  assert.ok(schema.includes("enum AuditEvent"), "Prisma schema icinde AuditEvent enumu bulunmali.")

  if (warnings.length > 0) {
    console.warn(`Ops preflight warnings: ${warnings.join(" | ")}`)
  }

  console.log("Ops preflight passed.")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

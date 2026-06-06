import { db } from "../lib/db.ts"

function parseNumberArg(name, defaultValue) {
  const prefix = `--${name}=`
  const raw = process.argv.find((arg) => arg.startsWith(prefix))

  if (!raw) {
    return defaultValue
  }

  const parsed = Number(raw.slice(prefix.length))
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${name} icin gecerli bir sayi verin.`)
  }

  return Math.floor(parsed)
}

async function main() {
  const apply = process.argv.includes("--apply")
  const auditDays = parseNumberArg("audit-days", 90)
  const rateLimitDays = parseNumberArg("rate-limit-days", 7)
  const now = Date.now()
  const auditCutoff = new Date(now - auditDays * 24 * 60 * 60 * 1000)
  const rateLimitCutoff = new Date(now - rateLimitDays * 24 * 60 * 60 * 1000)

  try {
    const [auditCount, rateLimitCount] = await Promise.all([
      db.auditLog.count({
        where: {
          createdAt: {
            lt: auditCutoff,
          },
        },
      }),
      db.rateLimitBucket.count({
        where: {
          resetAt: {
            lt: rateLimitCutoff,
          },
        },
      }),
    ])

    if (!apply) {
      console.log(
        JSON.stringify(
          {
            mode: "dry-run",
            auditDays,
            rateLimitDays,
            deletions: {
              auditLogs: auditCount,
              rateLimitBuckets: rateLimitCount,
            },
          },
          null,
          2
        )
      )
      return
    }

    const [auditResult, rateLimitResult] = await Promise.all([
      db.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: auditCutoff,
          },
        },
      }),
      db.rateLimitBucket.deleteMany({
        where: {
          resetAt: {
            lt: rateLimitCutoff,
          },
        },
      }),
    ])

    console.log(
      JSON.stringify(
        {
          mode: "apply",
          auditDays,
          rateLimitDays,
          deleted: {
            auditLogs: auditResult.count,
            rateLimitBuckets: rateLimitResult.count,
          },
        },
        null,
        2
      )
    )
  } finally {
    await db.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

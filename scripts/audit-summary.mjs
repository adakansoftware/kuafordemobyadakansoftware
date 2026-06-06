import { db } from "../lib/db.ts"

function parseNumberArg(name, defaultValue) {
  const prefix = `--${name}=`
  const raw = process.argv.find((arg) => arg.startsWith(prefix))

  if (!raw) {
    return defaultValue
  }

  const parsed = Number(raw.slice(prefix.length))
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} icin sifirdan buyuk bir sayi verin.`)
  }

  return Math.floor(parsed)
}

async function main() {
  const days = parseNumberArg("days", 7)
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  try {
    const [total, byEvent, byActorType, latestEntries] = await Promise.all([
      db.auditLog.count({
        where: {
          createdAt: {
            gte: cutoff,
          },
        },
      }),
      db.auditLog.groupBy({
        by: ["event"],
        where: {
          createdAt: {
            gte: cutoff,
          },
        },
        _count: {
          _all: true,
        },
        orderBy: {
          event: "asc",
        },
      }),
      db.auditLog.groupBy({
        by: ["actorType"],
        where: {
          createdAt: {
            gte: cutoff,
          },
        },
        _count: {
          _all: true,
        },
        orderBy: {
          actorType: "asc",
        },
      }),
      db.auditLog.findMany({
        where: {
          createdAt: {
            gte: cutoff,
          },
        },
        select: {
          event: true,
          actorType: true,
          actorIdentifier: true,
          targetType: true,
          targetId: true,
          createdAt: true,
          requestId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),
    ])

    console.log(
      JSON.stringify(
        {
          windowDays: days,
          total,
          byEvent: byEvent.map((row) => ({
            event: row.event,
            count: row._count._all,
          })),
          byActorType: byActorType.map((row) => ({
            actorType: row.actorType,
            count: row._count._all,
          })),
          latestEntries,
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

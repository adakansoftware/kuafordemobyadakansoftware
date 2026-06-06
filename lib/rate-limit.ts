import { db } from "@/lib/db"

type RateLimitEntry = {
  count: number
  resetAt: number
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
  source: "database" | "memory"
}

const memoryStores = new Map<string, Map<string, RateLimitEntry>>()
const MAX_KEYS_PER_NAMESPACE = 5000
let lastPruneAt = 0
const PRUNE_INTERVAL_MS = 5 * 60 * 1000

function pruneMemoryNamespace(namespaceStore: Map<string, RateLimitEntry>, now: number) {
  for (const [key, entry] of namespaceStore.entries()) {
    if (entry.resetAt <= now) {
      namespaceStore.delete(key)
    }
  }

  if (namespaceStore.size <= MAX_KEYS_PER_NAMESPACE) {
    return
  }

  const sortedEntries = Array.from(namespaceStore.entries()).sort((left, right) => left[1].resetAt - right[1].resetAt)
  const overflow = sortedEntries.length - MAX_KEYS_PER_NAMESPACE

  for (let index = 0; index < overflow; index += 1) {
    namespaceStore.delete(sortedEntries[index][0])
  }
}

function applyMemoryRateLimit(input: {
  key: string
  namespace: string
  limit: number
  windowMs: number
}): RateLimitResult {
  const now = Date.now()
  const safeKey = input.key.trim().slice(0, 128) || "unknown"
  const namespaceStore = memoryStores.get(input.namespace) ?? new Map<string, RateLimitEntry>()
  const existing = namespaceStore.get(safeKey)

  if (!memoryStores.has(input.namespace)) {
    memoryStores.set(input.namespace, namespaceStore)
  }

  pruneMemoryNamespace(namespaceStore, now)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + input.windowMs
    namespaceStore.set(safeKey, {
      count: 1,
      resetAt,
    })

    return {
      allowed: true,
      remaining: input.limit - 1,
      resetAt,
      source: "memory",
    }
  }

  if (existing.count >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      source: "memory",
    }
  }

  existing.count += 1

  return {
    allowed: true,
    remaining: Math.max(input.limit - existing.count, 0),
    resetAt: existing.resetAt,
    source: "memory",
  }
}

async function pruneExpiredRateLimits(now: Date) {
  const nowTime = now.getTime()

  if (nowTime - lastPruneAt < PRUNE_INTERVAL_MS) {
    return
  }

  lastPruneAt = nowTime

  await db.rateLimitBucket.deleteMany({
    where: {
      resetAt: {
        lt: now,
      },
    },
  })
}

export async function applyRateLimit(input: {
  key: string
  namespace: string
  limit: number
  windowMs: number
}): Promise<RateLimitResult> {
  const safeKey = input.key.trim().slice(0, 128) || "unknown"
  const now = new Date()

  try {
    await pruneExpiredRateLimits(now)

    return await db.$transaction(async (tx) => {
      const existing = await tx.rateLimitBucket.findUnique({
        where: {
          namespace_key: {
            namespace: input.namespace,
            key: safeKey,
          },
        },
      })

      if (!existing || existing.resetAt.getTime() <= now.getTime()) {
        const resetAt = new Date(now.getTime() + input.windowMs)

        await tx.rateLimitBucket.upsert({
          where: {
            namespace_key: {
              namespace: input.namespace,
              key: safeKey,
            },
          },
          create: {
            namespace: input.namespace,
            key: safeKey,
            count: 1,
            resetAt,
          },
          update: {
            count: 1,
            resetAt,
          },
        })

        return {
          allowed: true,
          remaining: input.limit - 1,
          resetAt: resetAt.getTime(),
          source: "database",
        }
      }

      if (existing.count >= input.limit) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: existing.resetAt.getTime(),
          source: "database",
        }
      }

      const updated = await tx.rateLimitBucket.update({
        where: {
          namespace_key: {
            namespace: input.namespace,
            key: safeKey,
          },
        },
        data: {
          count: {
            increment: 1,
          },
        },
      })

      return {
        allowed: true,
        remaining: Math.max(input.limit - updated.count, 0),
        resetAt: updated.resetAt.getTime(),
        source: "database",
      }
    })
  } catch {
    return applyMemoryRateLimit(input)
  }
}

import { db } from "@/lib/db"
import { logEvent } from "@/lib/observability"
import { Prisma } from "@prisma/client"

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

export type RateLimitState = {
  count: number
  resetAt: number
  source: "database" | "memory"
}

export type RateLimitClaimResult = {
  ok: boolean
  resetAt: number
  source: "database" | "memory"
}

const memoryStores = new Map<string, Map<string, RateLimitEntry>>()
const MAX_NAMESPACES = 100
const MAX_KEYS_PER_NAMESPACE = 5000
let lastPruneAt = 0
const PRUNE_INTERVAL_MS = 5 * 60 * 1000
const fallbackLogState = new Map<string, number>()

function pruneMemoryStores(now: number) {
  for (const [namespace, namespaceStore] of memoryStores.entries()) {
    pruneMemoryNamespace(namespaceStore, now)

    if (namespaceStore.size === 0) {
      memoryStores.delete(namespace)
    }
  }

  if (memoryStores.size <= MAX_NAMESPACES) {
    return
  }

  const namespaces = Array.from(memoryStores.keys())
  const overflow = namespaces.length - MAX_NAMESPACES

  for (let index = 0; index < overflow; index += 1) {
    memoryStores.delete(namespaces[index])
  }
}

function logRateLimitFallback(namespace: string, error: unknown) {
  const now = Date.now()
  const lastLoggedAt = fallbackLogState.get(namespace) ?? 0

  if (now - lastLoggedAt < 60_000) {
    return
  }

  fallbackLogState.set(namespace, now)

  logEvent({
    level: "warn",
    event: "rate_limit_memory_fallback",
    route: "rate-limit",
    message: error instanceof Error ? error.message : "Rate limit database fallback triggered.",
    meta: {
      namespace,
    },
  })
}

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

  pruneMemoryStores(now)
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

function peekMemoryRateLimitState(input: {
  key: string
  namespace: string
}): RateLimitState | null {
  const now = Date.now()
  const safeKey = input.key.trim().slice(0, 128) || "unknown"
  const namespaceStore = memoryStores.get(input.namespace)

  if (!namespaceStore) {
    return null
  }

  pruneMemoryStores(now)
  pruneMemoryNamespace(namespaceStore, now)

  const existing = namespaceStore.get(safeKey)

  if (!existing || existing.resetAt <= now) {
    return null
  }

  return {
    count: existing.count,
    resetAt: existing.resetAt,
    source: "memory",
  }
}

function setMemoryRateLimitState(input: {
  key: string
  namespace: string
  count: number
  windowMs: number
}): RateLimitState {
  const now = Date.now()
  const safeKey = input.key.trim().slice(0, 128) || "unknown"
  const namespaceStore = memoryStores.get(input.namespace) ?? new Map<string, RateLimitEntry>()

  if (!memoryStores.has(input.namespace)) {
    memoryStores.set(input.namespace, namespaceStore)
  }

  pruneMemoryStores(now)
  pruneMemoryNamespace(namespaceStore, now)

  const resetAt = now + input.windowMs
  namespaceStore.set(safeKey, {
    count: Math.max(0, input.count),
    resetAt,
  })

  return {
    count: Math.max(0, input.count),
    resetAt,
    source: "memory",
  }
}

function claimMemoryRateLimitWindow(input: {
  key: string
  namespace: string
  windowMs: number
}): RateLimitClaimResult {
  const now = Date.now()
  const safeKey = input.key.trim().slice(0, 128) || "unknown"
  const namespaceStore = memoryStores.get(input.namespace) ?? new Map<string, RateLimitEntry>()

  if (!memoryStores.has(input.namespace)) {
    memoryStores.set(input.namespace, namespaceStore)
  }

  pruneMemoryStores(now)
  pruneMemoryNamespace(namespaceStore, now)

  const existing = namespaceStore.get(safeKey)

  if (existing && existing.resetAt > now) {
    return {
      ok: false,
      resetAt: existing.resetAt,
      source: "memory",
    }
  }

  const resetAt = now + input.windowMs
  namespaceStore.set(safeKey, {
    count: 1,
    resetAt,
  })

  return {
    ok: true,
    resetAt,
    source: "memory",
  }
}

async function pruneExpiredRateLimits(now: Date) {
  const nowTime = now.getTime()

  if (nowTime - lastPruneAt < PRUNE_INTERVAL_MS) {
    return
  }

  lastPruneAt = nowTime

  try {
    await db.rateLimitBucket.deleteMany({
      where: {
        resetAt: {
          lt: now,
        },
      },
    })
  } catch (error) {
    logEvent({
      level: "warn",
      event: "rate_limit_prune_failed",
      route: "rate-limit",
      message: error instanceof Error ? error.message : "Rate limit prune failed.",
      meta: {
        now: now.toISOString(),
      },
    })
  }
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
  } catch (error) {
    logRateLimitFallback(input.namespace, error)
    return applyMemoryRateLimit(input)
  }
}

export async function peekRateLimitState(input: {
  key: string
  namespace: string
}): Promise<RateLimitState | null> {
  const safeKey = input.key.trim().slice(0, 128) || "unknown"
  const now = new Date()

  try {
    const existing = await db.rateLimitBucket.findUnique({
      where: {
        namespace_key: {
          namespace: input.namespace,
          key: safeKey,
        },
      },
    })

    if (!existing || existing.resetAt.getTime() <= now.getTime()) {
      return null
    }

    return {
      count: existing.count,
      resetAt: existing.resetAt.getTime(),
      source: "database",
    }
  } catch (error) {
    logRateLimitFallback(input.namespace, error)
    return peekMemoryRateLimitState(input)
  }
}

export async function setRateLimitState(input: {
  key: string
  namespace: string
  count: number
  windowMs: number
}): Promise<RateLimitState> {
  const safeKey = input.key.trim().slice(0, 128) || "unknown"
  const now = new Date()
  const resetAt = new Date(now.getTime() + input.windowMs)

  try {
    await db.rateLimitBucket.upsert({
      where: {
        namespace_key: {
          namespace: input.namespace,
          key: safeKey,
        },
      },
      create: {
        namespace: input.namespace,
        key: safeKey,
        count: Math.max(0, input.count),
        resetAt,
      },
      update: {
        count: Math.max(0, input.count),
        resetAt,
      },
    })

    return {
      count: Math.max(0, input.count),
      resetAt: resetAt.getTime(),
      source: "database",
    }
  } catch (error) {
    logRateLimitFallback(input.namespace, error)
    return setMemoryRateLimitState(input)
  }
}

export async function claimRateLimitWindow(input: {
  key: string
  namespace: string
  windowMs: number
}): Promise<RateLimitClaimResult> {
  const safeKey = input.key.trim().slice(0, 128) || "unknown"
  const now = new Date()
  const nextResetAt = new Date(now.getTime() + input.windowMs)

  try {
    const existing = await db.rateLimitBucket.findUnique({
      where: {
        namespace_key: {
          namespace: input.namespace,
          key: safeKey,
        },
      },
    })

    if (!existing) {
      try {
        await db.rateLimitBucket.create({
          data: {
            namespace: input.namespace,
            key: safeKey,
            count: 1,
            resetAt: nextResetAt,
          },
        })

        return {
          ok: true,
          resetAt: nextResetAt.getTime(),
          source: "database",
        }
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
          throw error
        }
      }
    } else if (existing.resetAt.getTime() > now.getTime()) {
      return {
        ok: false,
        resetAt: existing.resetAt.getTime(),
        source: "database",
      }
    }

    const updated = await db.rateLimitBucket.updateMany({
      where: {
        namespace: input.namespace,
        key: safeKey,
        resetAt: {
          lte: now,
        },
      },
      data: {
        count: 1,
        resetAt: nextResetAt,
      },
    })

    if (updated.count === 1) {
      return {
        ok: true,
        resetAt: nextResetAt.getTime(),
        source: "database",
      }
    }

    const current = await db.rateLimitBucket.findUnique({
      where: {
        namespace_key: {
          namespace: input.namespace,
          key: safeKey,
        },
      },
    })

    if (current) {
      return {
        ok: current.resetAt.getTime() <= now.getTime(),
        resetAt: current.resetAt.getTime(),
        source: "database",
      }
    }

    return {
      ok: true,
      resetAt: nextResetAt.getTime(),
      source: "database",
    }
  } catch (error) {
    logRateLimitFallback(input.namespace, error)
    return claimMemoryRateLimitWindow(input)
  }
}

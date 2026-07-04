import { Prisma } from "@prisma/client"
import { db } from "./db.ts"
import { peekRateLimitState, setRateLimitState } from "./rate-limit.ts"

type ConcurrencyState = {
  inFlight: number
}

type CircuitBreakerState = {
  failures: number
  openUntil: number
}

const concurrencyStores = new Map<string, ConcurrencyState>()
const circuitBreakerStore = new Map<string, CircuitBreakerState>()

export type ConcurrencyLease = {
  release: () => void | Promise<void>
}

function enterMemoryConcurrencyGuard(namespace: string, limit: number): ConcurrencyLease | null {
  const state = concurrencyStores.get(namespace) ?? { inFlight: 0 }

  if (!concurrencyStores.has(namespace)) {
    concurrencyStores.set(namespace, state)
  }

  if (state.inFlight >= limit) {
    return null
  }

  state.inFlight += 1

  return {
    release: () => {
      state.inFlight = Math.max(state.inFlight - 1, 0)

      if (state.inFlight === 0) {
        concurrencyStores.delete(namespace)
      }
    },
  }
}

async function enterDistributedConcurrencyGuard(input: {
  namespace: string
  limit: number
  leaseMs: number
}): Promise<ConcurrencyLease | null> {
  const key = "state"
  const rowNamespace = `concurrency:${input.namespace}`
  const now = new Date()
  const leaseUntil = new Date(now.getTime() + input.leaseMs)

  try {
    const existing = await db.rateLimitBucket.findUnique({
      where: {
        namespace_key: {
          namespace: rowNamespace,
          key,
        },
      },
    })

    if (!existing || existing.resetAt.getTime() <= now.getTime()) {
      try {
        await db.rateLimitBucket.upsert({
          where: {
            namespace_key: {
              namespace: rowNamespace,
              key,
            },
          },
          create: {
            namespace: rowNamespace,
            key,
            count: 1,
            resetAt: leaseUntil,
          },
          update: {
            count: 1,
            resetAt: leaseUntil,
          },
        })

        return {
          release: async () => {
            await releaseDistributedConcurrencyGuard(rowNamespace, key)
          },
        }
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
          throw error
        }
      }
    } else if (existing.count >= input.limit) {
      return null
    }

    const updated = await db.rateLimitBucket.updateMany({
      where: {
        namespace: rowNamespace,
        key,
        resetAt: {
          gt: now,
        },
        count: {
          lt: input.limit,
        },
      },
      data: {
        count: {
          increment: 1,
        },
        resetAt: leaseUntil,
      },
    })

    if (updated.count !== 1) {
      return null
    }

    return {
      release: async () => {
        await releaseDistributedConcurrencyGuard(rowNamespace, key)
      },
    }
  } catch {
    return enterMemoryConcurrencyGuard(input.namespace, input.limit)
  }
}

async function releaseDistributedConcurrencyGuard(namespace: string, key: string) {
  const now = new Date()

  try {
    const zeroed = await db.rateLimitBucket.updateMany({
      where: {
        namespace,
        key,
        count: 1,
      },
      data: {
        count: 0,
        resetAt: now,
      },
    })

    if (zeroed.count === 1) {
      return
    }

    await db.rateLimitBucket.updateMany({
      where: {
        namespace,
        key,
        count: {
          gt: 1,
        },
      },
      data: {
        count: {
          decrement: 1,
        },
      },
    })
  } catch {
    // best-effort release; lease expiry still prevents permanent deadlock
  }
}

export async function enterConcurrencyGuard(
  namespace: string,
  limit: number,
  options?: { leaseMs?: number }
): Promise<ConcurrencyLease | null> {
  return enterDistributedConcurrencyGuard({
    namespace,
    limit,
    leaseMs: options?.leaseMs ?? 15_000,
  })
}

export async function withTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message = "Operation timed out."
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message))
    }, timeoutMs)
  })

  try {
    return await Promise.race([operation, timeoutPromise])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

export async function withCircuitBreaker<T>(
  namespace: string,
  operation: () => Promise<T>,
  options: {
    failureThreshold: number
    coolDownMs: number
  }
): Promise<T> {
  const inMemoryState = circuitBreakerStore.get(namespace) ?? {
    failures: 0,
    openUntil: 0,
  }
  const now = Date.now()
  const storedState = await peekRateLimitState({
    namespace: `circuit-breaker:${namespace}`,
    key: "state",
  })
  const state = {
    failures: Math.max(inMemoryState.failures, storedState?.count ?? 0),
    openUntil: Math.max(inMemoryState.openUntil, storedState?.resetAt ?? 0),
  }

  if (state.openUntil > now) {
    throw new Error("Circuit breaker is open.")
  }

  try {
    const result = await operation()
    circuitBreakerStore.delete(namespace)
    await setRateLimitState({
      namespace: `circuit-breaker:${namespace}`,
      key: "state",
      count: 0,
      windowMs: 1_000,
    })
    return result
  } catch (error) {
    state.failures += 1

    if (state.failures >= options.failureThreshold) {
      state.openUntil = now + options.coolDownMs
    }

    circuitBreakerStore.set(namespace, state)
    await setRateLimitState({
      namespace: `circuit-breaker:${namespace}`,
      key: "state",
      count: state.failures,
      windowMs: state.openUntil > now ? options.coolDownMs : 60_000,
    })
    throw error
  }
}

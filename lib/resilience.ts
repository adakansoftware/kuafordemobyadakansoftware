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
  release: () => void
}

export function enterConcurrencyGuard(namespace: string, limit: number): ConcurrencyLease | null {
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
  const state = circuitBreakerStore.get(namespace) ?? {
    failures: 0,
    openUntil: 0,
  }
  const now = Date.now()

  if (state.openUntil > now) {
    throw new Error("Circuit breaker is open.")
  }

  try {
    const result = await operation()
    circuitBreakerStore.delete(namespace)
    return result
  } catch (error) {
    state.failures += 1

    if (state.failures >= options.failureThreshold) {
      state.openUntil = now + options.coolDownMs
    }

    circuitBreakerStore.set(namespace, state)
    throw error
  }
}

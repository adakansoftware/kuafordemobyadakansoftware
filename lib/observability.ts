type LogLevel = "info" | "warn" | "error"

type LogEventOptions = {
  level?: LogLevel
  event: string
  requestId?: string
  route?: string
  message?: string
  meta?: Record<string, unknown>
}

function sanitizeMetaValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((entry) => sanitizeMetaValue(entry))
  }

  if (typeof value === "object") {
    return sanitizeMeta(value as Record<string, unknown>)
  }

  if (typeof value === "string") {
    return value.length > 240 ? `${value.slice(0, 237)}...` : value
  }

  return value
}

function sanitizeMeta(meta: Record<string, unknown>) {
  const blockedKeyPattern = /(token|secret|password|authorization|cookie|email|phone)/i

  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => [
      key,
      blockedKeyPattern.test(key) ? "[redacted]" : sanitizeMetaValue(value),
    ])
  )
}

export function sanitizeLogMeta(meta: Record<string, unknown>) {
  return sanitizeMeta(meta)
}

export function logEvent({ level = "info", event, requestId, route, message, meta = {} }: LogEventOptions) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    requestId,
    route,
    message,
    meta: sanitizeLogMeta(meta),
  }

  if (level === "error") {
    console.error(JSON.stringify(payload))
    return
  }

  if (level === "warn") {
    console.warn(JSON.stringify(payload))
    return
  }

  console.info(JSON.stringify(payload))
}

export function getDurationMs(startTime: number) {
  return Math.max(0, Date.now() - startTime)
}

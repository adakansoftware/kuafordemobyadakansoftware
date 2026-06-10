export type HealthCheckItem = {
  key: string
  ok: boolean
  detail: string
}

export type HealthSummary = {
  status: "ok" | "warn" | "error"
  checks: HealthCheckItem[]
}

export type HealthScope = "live" | "ready"

export function resolveHealthScope(scope: string | null | undefined): HealthScope {
  return scope === "live" ? "live" : "ready"
}

export function buildHealthSummary(options: {
  scope: HealthScope
  databaseOk: boolean
  envIssues: string[]
  hasCanonicalUrl: boolean
  adminConfigured: boolean
  allowedHostsConfigured: boolean
  rateLimitStorageOk: boolean
  auditLogStorageOk: boolean
}) {
  const checks: HealthCheckItem[] = [
    {
      key: "database",
      ok: options.databaseOk,
      detail: options.databaseOk ? "Veritabani baglantisi saglikli." : "Veritabani baglantisi basarisiz.",
    },
    {
      key: "environment",
      ok: options.envIssues.length === 0,
      detail: options.envIssues[0] ?? "Ortam degiskenleri tamam.",
    },
    {
      key: "canonical_url",
      ok: options.hasCanonicalUrl,
      detail: options.hasCanonicalUrl ? "Canonical site adresi tanimli." : "Canonical site adresi eksik.",
    },
    {
      key: "admin_auth",
      ok: options.adminConfigured,
      detail: options.adminConfigured
        ? "Admin kimlik dogrulamasi yapilandirilmis."
        : "Admin kimlik dogrulamasi eksik veya zayif.",
    },
    {
      key: "origin_hosts",
      ok: options.allowedHostsConfigured,
      detail: options.allowedHostsConfigured ? "Izinli host listesi hazir." : "Izinli host listesi eksik.",
    },
    {
      key: "rate_limit_storage",
      ok: options.rateLimitStorageOk,
      detail: options.rateLimitStorageOk
        ? "Rate-limit depolama tablosu hazir."
        : "Rate-limit depolama tablosu eksik veya erisilemiyor.",
    },
    {
      key: "audit_log_storage",
      ok: options.auditLogStorageOk,
      detail: options.auditLogStorageOk
        ? "Audit log depolama tablosu hazir."
        : "Audit log depolama tablosu eksik veya erisilemiyor.",
    },
  ]

  const requiredKeys =
    options.scope === "live"
      ? new Set<HealthCheckItem["key"]>(["database"])
      : new Set<HealthCheckItem["key"]>(["database", "rate_limit_storage", "audit_log_storage"])

  const hasError = checks.some((check) => requiredKeys.has(check.key) && !check.ok)
  const hasWarning = checks.some((check) => !check.ok)

  return {
    status: hasError ? "error" : hasWarning ? "warn" : "ok",
    checks,
  } satisfies HealthSummary
}

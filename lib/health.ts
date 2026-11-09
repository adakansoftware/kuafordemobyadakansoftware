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

export function shouldExposeDetailedHealth(scope: HealthScope, isAuthorized: boolean) {
  return scope === "ready" && isAuthorized
}

export function buildHealthSummary(options: {
  scope: HealthScope
  databaseOk: boolean
  envIssues: string[]
  hasCanonicalUrl: boolean
  adminConfigured: boolean
  securitySecretConfigured: boolean
  healthTokenConfigured: boolean
  turnstileConfigured: boolean
  adminAllowlistConfigured: boolean
  healthcheckAllowlistConfigured: boolean
  allowedHostsConfigured: boolean
  rateLimitStorageOk: boolean
  auditLogStorageOk: boolean
}) {
  const checks: HealthCheckItem[] = [
    {
      key: "database",
      ok: options.databaseOk,
      detail: options.databaseOk ? "Veritabanı bağlantısı sağlıklı." : "Veritabanı bağlantısı başarısız.",
    },
    {
      key: "environment",
      ok: options.envIssues.length === 0,
      detail: options.envIssues[0] ?? "Ortam değişkenleri tamam.",
    },
    {
      key: "canonical_url",
      ok: options.hasCanonicalUrl,
      detail: options.hasCanonicalUrl ? "Canonical site adresi tanımlı." : "Canonical site adresi eksik.",
    },
    {
      key: "admin_auth",
      ok: options.adminConfigured,
      detail: options.adminConfigured
        ? "Admin kimlik doğrulaması yapılandırılmış."
        : "Admin kimlik doğrulaması eksik veya zayıf.",
    },
    {
      key: "security_secret",
      ok: options.securitySecretConfigured,
      detail: options.securitySecretConfigured
        ? "Uygulama güvenlik sırrı tanımlı."
        : "APP_SECURITY_SECRET eksik veya zayıf.",
    },
    {
      key: "health_token",
      ok: options.healthTokenConfigured,
      detail: options.healthTokenConfigured
        ? "Health readiness token tanımlı."
        : "HEALTHCHECK_TOKEN tanımlı değil veya zayıf.",
    },
    {
      key: "turnstile",
      ok: options.turnstileConfigured,
      detail: options.turnstileConfigured
        ? "Turnstile bot doğrulaması yapılandırılmış."
        : "Turnstile devre dışı.",
    },
    {
      key: "admin_allowlist",
      ok: options.adminAllowlistConfigured,
      detail: options.adminAllowlistConfigured
        ? "Admin IP allowlist tanımlı."
        : "Admin IP allowlist tanımlı değil.",
    },
    {
      key: "healthcheck_allowlist",
      ok: options.healthcheckAllowlistConfigured,
      detail: options.healthcheckAllowlistConfigured
        ? "Health readiness IP allowlist tanımlı."
        : "Health readiness IP allowlist tanımlı değil.",
    },
    {
      key: "origin_hosts",
      ok: options.allowedHostsConfigured,
      detail: options.allowedHostsConfigured ? "İzinli host listesi hazır." : "İzinli host listesi eksik.",
    },
    {
      key: "rate_limit_storage",
      ok: options.rateLimitStorageOk,
      detail: options.rateLimitStorageOk
        ? "Rate-limit depolama tablosu hazır."
        : "Rate-limit depolama tablosu eksik veya erişilemiyor.",
    },
    {
      key: "audit_log_storage",
      ok: options.auditLogStorageOk,
      detail: options.auditLogStorageOk
        ? "Audit log depolama tablosu hazır."
        : "Audit log depolama tablosu eksik veya erişilemiyor.",
    },
  ]

  const requiredKeys =
    options.scope === "live"
      ? new Set<HealthCheckItem["key"]>(["database"])
      : new Set<HealthCheckItem["key"]>([
          "database",
          "rate_limit_storage",
          "audit_log_storage",
          "health_token",
          "healthcheck_allowlist",
        ])

  const hasError = checks.some((check) => requiredKeys.has(check.key) && !check.ok)
  const hasWarning = checks.some((check) => !check.ok)

  return {
    status: hasError ? "error" : hasWarning ? "warn" : "ok",
    checks,
  } satisfies HealthSummary
}

export type HealthCheckItem = {
  key: string
  ok: boolean
  detail: string
}

export type HealthSummary = {
  status: "ok" | "warn" | "error"
  checks: HealthCheckItem[]
}

export function buildHealthSummary(options: {
  databaseOk: boolean
  envIssues: string[]
  hasCanonicalUrl: boolean
  adminConfigured: boolean
  allowedHostsConfigured: boolean
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
  ]

  const hasError = checks.some((check) => check.key === "database" && !check.ok)
  const hasWarning = checks.some((check) => !check.ok)

  return {
    status: hasError ? "error" : hasWarning ? "warn" : "ok",
    checks,
  } satisfies HealthSummary
}

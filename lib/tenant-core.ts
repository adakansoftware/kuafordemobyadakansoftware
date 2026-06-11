export const DEFAULT_TENANT_SLUG = "default"

export function normalizeTenantSlug(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function resolveTenantSlugFromHost(host: string | null | undefined) {
  const normalizedHost = (host ?? "").trim().toLowerCase()

  if (!normalizedHost || normalizedHost.startsWith("localhost") || /^\d+\.\d+\.\d+\.\d+/.test(normalizedHost)) {
    return null
  }

  const withoutPort = normalizedHost.split(":")[0] ?? normalizedHost
  const parts = withoutPort.split(".").filter(Boolean)

  if (parts.length < 3) {
    return null
  }

  return normalizeTenantSlug(parts[0])
}

export function isCrossTenantAccess(currentTenantId: string, recordTenantId: string) {
  return currentTenantId !== recordTenantId
}

export function filterRecordsByTenantId<T extends { tenantId: string }>(records: T[], tenantId: string) {
  return records.filter((record) => record.tenantId === tenantId)
}

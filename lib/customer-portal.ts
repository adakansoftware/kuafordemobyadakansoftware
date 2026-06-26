export function normalizeCustomerPortalIdentifier(identifier: string) {
  const normalized = identifier.trim()

  if (!normalized) {
    return ""
  }

  if (normalized.includes("@")) {
    return normalized.toLowerCase()
  }

  return normalized.replace(/[^\d]/g, "")
}

export function getCustomerPortalSessionMaxAgeSeconds() {
  return 60 * 60 * 12
}

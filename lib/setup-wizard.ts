export const MAX_SETUP_STAFF_COUNT = 20
export const MAX_SETUP_SERVICE_COUNT = 30

function normalizeSetupKey(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR")
}

export function normalizeSetupSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function parseSetupList(value: string, options: { maxItems: number }) {
  const seen = new Set<string>()
  const items: string[] = []

  for (const rawItem of value.split(",")) {
    const item = rawItem.trim()

    if (!item) {
      continue
    }

    const key = normalizeSetupKey(item)

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    items.push(item)

    if (items.length >= options.maxItems) {
      break
    }
  }

  return items
}

export function buildSetupStaffMembers(value: string) {
  return parseSetupList(value, { maxItems: MAX_SETUP_STAFF_COUNT }).map((name) => ({
    name,
    role: "Stilist",
  }))
}

export function buildSetupServices(value: string) {
  return parseSetupList(value, { maxItems: MAX_SETUP_SERVICE_COUNT }).map((title, index) => ({
    slug: `setup-service-${index + 1}-${normalizeSetupSlug(title)}`,
    title,
    shortTitle: title,
    teaser: `${title} hizmeti kurulum sihirbazi ile olusturuldu.`,
    description: `${title} hizmeti tenant kurulumu sirasinda otomatik tanimlandi.`,
    durationMinutes: 60,
    priceFrom: 1000 + index * 250,
  }))
}

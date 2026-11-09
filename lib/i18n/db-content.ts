import type { Locale } from "./validation.ts"

type LocalizableService = {
  title: string
  titleEn?: string | null
  shortTitle?: string | null
  shortTitleEn?: string | null
  teaser?: string | null
  teaserEn?: string | null
  description?: string | null
  descriptionEn?: string | null
  features?: unknown
  featuresEn?: unknown
}

type LocalizableStaff = {
  role: string
  roleEn?: string | null
  bio?: string | null
  bioEn?: string | null
}

function pickLocalized(primary: string | null | undefined, fallback: string | null | undefined) {
  const trimmed = (primary ?? "").trim()
  return trimmed.length > 0 ? trimmed : (fallback ?? "")
}

export function localizedServiceFields<T extends LocalizableService>(service: T, locale: Locale) {
  if (locale !== "en") {
    return {
      title: service.title,
      shortTitle: service.shortTitle ?? "",
      teaser: service.teaser ?? "",
      description: service.description ?? "",
      features: service.features,
    }
  }

  return {
    title: pickLocalized(service.titleEn, service.title),
    shortTitle: pickLocalized(service.shortTitleEn, service.shortTitle),
    teaser: pickLocalized(service.teaserEn, service.teaser),
    description: pickLocalized(service.descriptionEn, service.description),
    features: service.featuresEn != null ? service.featuresEn : service.features,
  }
}

export function localizedStaffFields<T extends LocalizableStaff>(staff: T, locale: Locale) {
  if (locale !== "en") {
    return {
      role: staff.role,
      bio: staff.bio ?? "",
    }
  }

  return {
    role: pickLocalized(staff.roleEn, staff.role),
    bio: pickLocalized(staff.bioEn, staff.bio),
  }
}

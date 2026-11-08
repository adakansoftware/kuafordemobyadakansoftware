import type { Locale } from "../i18n/validation.ts"
import { siteContentEn } from "./en.ts"
import { siteContent } from "./tr.ts"
import type { SiteContent } from "./types.ts"

export function getSiteContent(locale: Locale): SiteContent {
  return locale === "en" ? siteContentEn : siteContent
}

export { siteContent } from "./tr.ts"
export type { SiteContent, NavLink, Service, Testimonial } from "./types.ts"

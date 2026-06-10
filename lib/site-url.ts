import { getOptionalEnv } from "./env.ts"
import { siteContent } from "./site-content.ts"

export function getSiteUrlString() {
  return getOptionalEnv().NEXT_PUBLIC_SITE_URL?.trim() || siteContent.seo.siteUrl
}

export function getSiteUrl() {
  return new URL(getSiteUrlString())
}

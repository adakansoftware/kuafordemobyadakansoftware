import { getEnv, getOptionalEnv } from "./env.ts"
import { siteContent } from "./site-content.ts"

export function getSiteUrlString() {
  const env = getOptionalEnv()

  if (env.NEXT_PUBLIC_SITE_URL?.trim()) {
    return env.NEXT_PUBLIC_SITE_URL.trim()
  }

  if (env.NODE_ENV === "production") {
    return getEnv().NEXT_PUBLIC_SITE_URL!
  }

  return siteContent.seo.siteUrl
}

export function getSiteUrl() {
  return new URL(getSiteUrlString())
}

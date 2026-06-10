import assert from "node:assert/strict"
import { getEnv, resetEnvCacheForTests } from "../lib/env.ts"
import { getAboutPageViewModel, getBookingPageViewModel, getHomePageViewModel } from "../lib/public-site.ts"
import { getOrganizationJsonLd } from "../lib/seo.ts"
import { siteContent } from "../lib/site-content.ts"
import { getSiteUrlString } from "../lib/site-url.ts"

const originalEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ALLOWED_ORIGIN_HOSTS: process.env.ALLOWED_ORIGIN_HOSTS,
  NODE_ENV: process.env.NODE_ENV,
}

function restoreEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }

  resetEnvCacheForTests()
}

export function runSiteConfigTests() {
  assert.equal(siteContent.contact.email, "adakansoftware@gmail.com")
  assert.equal(/[ÃÄÅ]/.test(siteContent.brand.legalName), false)
  assert.equal(/[ÃÄÅ]/.test(siteContent.brand.tagline), false)

  const homePage = getHomePageViewModel()
  const bookingPage = getBookingPageViewModel()
  const aboutPage = getAboutPageViewModel()

  assert.equal(/[ÃÄÅ]/.test(homePage.hero.title), false)
  assert.equal(/[ÃÄÅ]/.test(bookingPage.description), false)
  assert.equal(/[ÃÄÅ]/.test(aboutPage.title), false)

  process.env.DATABASE_URL = "postgresql://demo"
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.com"
  process.env.NODE_ENV = "development"
  resetEnvCacheForTests()

  assert.equal(getSiteUrlString(), "https://example.com")

  const organization = getOrganizationJsonLd()
  assert.equal(organization.url, "https://example.com")
  assert.equal(String(organization.image).startsWith("https://example.com/"), true)

  delete process.env.NEXT_PUBLIC_SITE_URL
  process.env.NODE_ENV = "development"
  resetEnvCacheForTests()
  assert.equal(getSiteUrlString(), siteContent.seo.siteUrl)

  process.env.NODE_ENV = "production"
  resetEnvCacheForTests()
  assert.throws(() => getEnv(), /NEXT_PUBLIC_SITE_URL zorunludur/)
  assert.throws(() => getSiteUrlString(), /NEXT_PUBLIC_SITE_URL zorunludur/)

  restoreEnv()
}

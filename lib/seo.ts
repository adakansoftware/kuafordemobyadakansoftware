import type { Metadata } from "next"
import { getSiteContent } from "./content/index.ts"
import type { Locale } from "./i18n/validation.ts"
import { getSiteUrl, getSiteUrlString } from "./site-url.ts"

export const siteUrl = getSiteUrl()

type BuildMetadataInput = {
  title?: string
  description?: string
  path?: string
  locale?: Locale
}

export function buildMetadata(input: BuildMetadataInput = {}): Metadata {
  const locale = input.locale ?? "tr"
  const content = getSiteContent(locale)
  const title = input.title ?? content.seo.defaultTitle
  const description = input.description ?? content.seo.description
  const canonicalPath = input.path ?? "/"
  const url = new URL(canonicalPath, siteUrl)
  const localizedPath = locale === "en" ? `/en${canonicalPath}` : canonicalPath

  return {
    title,
    description,
    keywords: [...content.seo.keywords],
    metadataBase: siteUrl,
    alternates: {
      canonical: localizedPath === "/" ? "/" : localizedPath,
      languages: {
        tr: canonicalPath === "/" ? "/" : canonicalPath,
        en: `/en${canonicalPath}`,
        "x-default": canonicalPath === "/" ? "/" : canonicalPath,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "tr_TR",
      url,
      siteName: content.brand.name,
      title,
      description,
      images: [
        {
          url: "/images/hero-salon.jpg",
          width: 1600,
          height: 900,
          alt: content.brand.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/hero-salon.jpg"],
    },
    category: "beauty",
  }
}

export function getOrganizationJsonLd() {
  const content = getSiteContent("tr")
  const sameAs = [content.social.instagram, content.social.tiktok].filter(Boolean)
  const canonicalSiteUrl = getSiteUrlString()

  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: content.brand.name,
    url: canonicalSiteUrl,
    image: `${canonicalSiteUrl}/images/hero-salon.jpg`,
    telephone: content.contact.phoneDisplay,
    email: content.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: content.contact.address,
      addressLocality: content.contact.city,
      addressCountry: "TR",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "21:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "10:00",
        closes: "18:00",
      },
    ],
    ...(sameAs.length ? { sameAs } : {}),
  }
}

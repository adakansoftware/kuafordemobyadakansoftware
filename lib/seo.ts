import type { Metadata } from "next"
import { siteContent } from "@/lib/site-content"

export const siteUrl = new URL(siteContent.seo.siteUrl)

type BuildMetadataInput = {
  title?: string
  description?: string
  path?: string
}

export function buildMetadata(input: BuildMetadataInput = {}): Metadata {
  const title = input.title ?? siteContent.seo.defaultTitle
  const description = input.description ?? siteContent.seo.description
  const canonicalPath = input.path ?? "/"
  const url = new URL(canonicalPath, siteUrl)

  return {
    title,
    description,
    keywords: [...siteContent.seo.keywords],
    metadataBase: siteUrl,
    alternates: {
      canonical: url.pathname === "/" ? "/" : url.pathname,
    },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      url,
      siteName: siteContent.brand.name,
      title,
      description,
      images: [
        {
          url: "/images/hero-salon.jpg",
          width: 1600,
          height: 900,
          alt: siteContent.brand.name,
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
  const sameAs = [siteContent.social.instagram, siteContent.social.tiktok].filter(Boolean)

  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: siteContent.brand.name,
    url: siteContent.seo.siteUrl,
    image: `${siteContent.seo.siteUrl}/images/hero-salon.jpg`,
    telephone: siteContent.contact.phoneDisplay,
    email: siteContent.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteContent.contact.address,
      addressLocality: siteContent.contact.city,
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

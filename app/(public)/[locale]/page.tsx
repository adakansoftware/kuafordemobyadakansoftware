import Script from "next/script"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { CtaSection } from "@/components/home/cta-section"
import { FaqSection } from "@/components/home/faq-section"
import { FeaturedServices } from "@/components/home/featured-services"
import { GallerySection } from "@/components/home/gallery-section"
import { HeroSection } from "@/components/home/hero-section"
import { IntroSection } from "@/components/home/intro-section"
import { StatsSection } from "@/components/home/stats-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { WhyUsSection } from "@/components/home/why-us-section"
import { normalizeLocale } from "@/lib/i18n/validation"
import { getHomePageViewModel } from "@/lib/public-site"
import { getOrganizationJsonLd } from "@/lib/seo"
import { routing } from "@/i18n/routing"

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  setRequestLocale(locale)
  const viewModel = getHomePageViewModel(normalizeLocale(locale))

  return (
    <>
      <Script
        id="organization-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationJsonLd()) }}
      />
      <HeroSection {...viewModel.hero} />
      <StatsSection stats={viewModel.stats} />
      <IntroSection {...viewModel.intro} />
      <WhyUsSection {...viewModel.reasons} />
      <FeaturedServices {...viewModel.featuredServices} />
      <GallerySection {...viewModel.gallery} />
      <TestimonialsSection {...viewModel.testimonials} />
      <FaqSection {...viewModel.faq} />
      <CtaSection {...viewModel.cta} />
    </>
  )
}

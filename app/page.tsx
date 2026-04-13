import Script from "next/script"
import { CtaSection } from "@/components/home/cta-section"
import { FeaturedServices } from "@/components/home/featured-services"
import { GallerySection } from "@/components/home/gallery-section"
import { HeroSection } from "@/components/home/hero-section"
import { IntroSection } from "@/components/home/intro-section"
import { StatsSection } from "@/components/home/stats-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { WhyUsSection } from "@/components/home/why-us-section"
import { getHomePageViewModel } from "@/lib/public-site"
import { getOrganizationJsonLd } from "@/lib/seo"

export default function HomePage() {
  const viewModel = getHomePageViewModel()

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
      <CtaSection {...viewModel.cta} />
    </>
  )
}

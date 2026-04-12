import Script from "next/script"
import { HeroSection } from "@/components/home/hero-section"
import { StatsSection } from "@/components/home/stats-section"
import { IntroSection } from "@/components/home/intro-section"
import { WhyUsSection } from "@/components/home/why-us-section"
import { FeaturedServices } from "@/components/home/featured-services"
import { GallerySection } from "@/components/home/gallery-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { CtaSection } from "@/components/home/cta-section"
import { getOrganizationJsonLd } from "@/lib/seo"

export default function HomePage() {
  return (
    <>
      <Script
        id="organization-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationJsonLd()) }}
      />
      <HeroSection />
      <StatsSection />
      <IntroSection />
      <WhyUsSection />
      <FeaturedServices />
      <GallerySection />
      <TestimonialsSection />
      <CtaSection />
    </>
  )
}

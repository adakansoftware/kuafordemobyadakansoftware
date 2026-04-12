import { HeroSection } from "@/components/home/hero-section"
import { StatsSection } from "@/components/home/stats-section"
import { IntroSection } from "@/components/home/intro-section"
import { WhyUsSection } from "@/components/home/why-us-section"
import { FeaturedServices } from "@/components/home/featured-services"
import { GallerySection } from "@/components/home/gallery-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { CtaSection } from "@/components/home/cta-section"

export default function HomePage() {
  return (
    <>
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

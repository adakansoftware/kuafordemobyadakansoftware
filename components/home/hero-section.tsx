import Image from "next/image"
import Link from "next/link"
import { siteContent } from "@/lib/site-content"

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <Image
        src="/images/hero-salon.jpg"
        alt="Bella Salon ic mekan"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-foreground/60" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-background/70">
          {siteContent.brand.tagline}
        </p>
        <h1 className="font-serif text-4xl font-bold leading-tight text-background md:text-6xl lg:text-7xl text-balance">
          {siteContent.brand.heroTitle}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-background/80 text-pretty">
          {siteContent.brand.heroDescription}
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/randevu"
            className="rounded-sm bg-accent px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-accent-foreground transition-all duration-300 hover:opacity-90"
          >
            Randevu Al
          </Link>
          <Link
            href="/hizmetler"
            className="rounded-sm border border-background/30 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-background transition-all duration-300 hover:bg-background/10"
          >
            Hizmetlerimiz
          </Link>
        </div>
      </div>
    </section>
  )
}

import Link from "next/link"
import { siteContent } from "@/lib/site-content"

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-primary py-24">
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <div className="h-96 w-96 rounded-full border border-primary-foreground" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
          {siteContent.cta.eyebrow}
        </p>
        <h2 className="mt-3 font-serif text-3xl font-bold text-primary-foreground md:text-5xl text-balance">
          {siteContent.cta.title}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-primary-foreground/70">
          {siteContent.cta.description}
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/randevu"
            className="rounded-full bg-accent px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.16em] text-accent-foreground transition-all duration-300 hover:opacity-90"
          >
            {siteContent.cta.primaryLabel}
          </Link>
          <a
            href={siteContent.contact.phoneHref}
            className="rounded-full border border-primary-foreground/30 px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-all duration-300 hover:bg-primary-foreground/10"
          >
            {siteContent.cta.secondaryLabel}
          </a>
        </div>
      </div>
    </section>
  )
}

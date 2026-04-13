import Image from "next/image"
import Link from "next/link"

type HeroMetric = {
  value: string
  label: string
}

type HeroSectionProps = {
  eyebrow: string
  title: string
  description: string
  highlights: string[]
  tagline: string
  noteTitle: string
  noteDescription: string
  metrics: HeroMetric[]
  primaryCtaHref: string
  primaryCtaLabel: string
  secondaryCtaHref: string
  secondaryCtaLabel: string
}

export function HeroSection(props: HeroSectionProps) {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <Image src="/images/hero-salon.jpg" alt="Adakan Hair Studio salon iç mekânı" fill className="object-cover" priority />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,17,13,0.42)_0%,rgba(21,17,13,0.78)_75%,rgba(21,17,13,0.88)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(222,177,93,0.28),transparent_36%)]" />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 pt-28 pb-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.32em] text-background/72">{props.eyebrow}</p>
          <h1 className="font-serif text-4xl font-bold leading-tight text-background md:text-6xl lg:text-7xl text-balance">
            {props.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-background/80 text-pretty">{props.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {props.highlights.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/16 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-background/84 backdrop-blur-sm"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row">
            <Link
              href={props.primaryCtaHref}
              className="rounded-full bg-accent px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-accent-foreground shadow-[0_14px_30px_rgba(222,177,93,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95"
            >
              {props.primaryCtaLabel}
            </Link>
            <Link
              href={props.secondaryCtaHref}
              className="rounded-full border border-background/30 px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-background transition-all duration-300 hover:bg-background/10"
            >
              {props.secondaryCtaLabel}
            </Link>
          </div>
        </div>

        <div className="lg:justify-self-end">
          <div className="rounded-[2rem] border border-white/14 bg-white/10 p-6 text-background shadow-[0_24px_60px_rgba(10,8,5,0.22)] backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.24em] text-background/68">{props.noteTitle}</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-balance">{props.tagline}</h2>
            <p className="mt-4 text-sm leading-relaxed text-background/72">{props.noteDescription}</p>
            <div className="mt-6 grid gap-4 border-t border-white/12 pt-5 sm:grid-cols-3 lg:grid-cols-1">
              {props.metrics.map((metric) => (
                <div key={metric.label}>
                  <div className="font-serif text-3xl font-bold">{metric.value}</div>
                  <div className="mt-1 text-sm text-background/68">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

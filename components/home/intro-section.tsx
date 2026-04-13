import Image from "next/image"

type IntroHighlight = {
  title: string
  description: string
}

type IntroSectionProps = {
  eyebrow: string
  title: string
  lead: string
  description: string
  highlights: IntroHighlight[]
}

export function IntroSection(props: IntroSectionProps) {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[0_24px_60px_rgba(26,20,12,0.1)]">
            <Image src="/images/about-salon.jpg" alt="Adakan Hair Studio" fill className="object-cover" />
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">{props.eyebrow}</p>
            <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-4xl text-balance">
              {props.title}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">{props.lead}</p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{props.description}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {props.highlights.map((item) => (
                <div key={item.title} className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
                  <p className="font-serif text-2xl font-bold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { Award, Clock, Heart, ShieldCheck, Sparkles, Users } from "lucide-react"

const reasonIcons = [Award, Sparkles, ShieldCheck, Heart, Users, Clock]

type ReasonItem = {
  title: string
  description: string
}

type WhyUsSectionProps = {
  eyebrow: string
  title: string
  description: string
  items: ReasonItem[]
}

export function WhyUsSection(props: WhyUsSectionProps) {
  return (
    <section className="bg-secondary py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">{props.eyebrow}</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-foreground md:text-4xl text-balance">{props.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{props.description}</p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {props.items.map((reason, index) => {
            const Icon = reasonIcons[index]

            return (
              <div
                key={reason.title}
                className="group rounded-[1.75rem] border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:border-accent/30 hover:shadow-[0_24px_50px_rgba(28,20,12,0.08)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{reason.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

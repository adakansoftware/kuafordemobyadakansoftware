import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

type FaqItem = {
  question: string
  answer: string
}

type FaqSectionProps = {
  eyebrow: string
  title: string
  description: string
  items: FaqItem[]
}

export function FaqSection(props: FaqSectionProps) {
  return (
    <section className="bg-secondary py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">{props.eyebrow}</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-foreground md:text-4xl text-balance">{props.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{props.description}</p>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <div className="rounded-[2rem] border border-border bg-card px-8 py-2 shadow-[0_24px_50px_rgba(28,20,12,0.06)]">
            <Accordion type="single" collapsible>
              {props.items.map((item) => (
                <AccordionItem key={item.question} value={item.question}>
                  <AccordionTrigger className="text-base font-medium text-foreground">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  )
}

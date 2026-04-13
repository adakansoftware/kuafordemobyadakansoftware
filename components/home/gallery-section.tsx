import Image from "next/image"

type GalleryItem = {
  src: string
  alt: string
}

type GallerySectionProps = {
  eyebrow: string
  title: string
  description: string
  items: GalleryItem[]
}

export function GallerySection(props: GallerySectionProps) {
  return (
    <section className="bg-secondary py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">{props.eyebrow}</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-foreground md:text-4xl text-balance">{props.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{props.description}</p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {props.items.map((item) => (
            <div
              key={item.src}
              className="group relative aspect-[3/4] overflow-hidden rounded-[1.75rem] shadow-[0_22px_48px_rgba(28,20,12,0.08)]"
            >
              <Image src={item.src} alt={item.alt} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(20,14,10,0.38))] opacity-70" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

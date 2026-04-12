import Image from "next/image"
import { siteContent } from "@/lib/site-content"

export function GallerySection() {
  return (
    <section className="bg-secondary py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Galeri</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-foreground md:text-4xl text-balance">
            Once ve Sonra
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Donusumleri ve uygulama sonuclarini kesfedin.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {siteContent.gallery.map((item) => (
            <div
              key={item.src}
              className="group relative aspect-[3/4] overflow-hidden rounded-lg"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-foreground/0 transition-all duration-300 group-hover:bg-foreground/20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

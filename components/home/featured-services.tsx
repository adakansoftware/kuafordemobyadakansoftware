import Image from "next/image"
import Link from "next/link"
import { siteContent } from "@/lib/site-content"

export function FeaturedServices() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">
            Hizmetlerimiz
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-foreground md:text-4xl text-balance">
            En çok talep gören hizmetler
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Salon içi en sık tercih edilen uygulamaları, net fiyat başlangıçları ve kısa içerikleriyle inceleyin.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {siteContent.services.slice(0, 3).map((service) => (
            <div
              key={service.title}
              className="group overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(28,20,12,0.08)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-foreground">{service.title}</h3>
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">{service.price}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {service.teaser}
                </p>
                <Link
                  href="/randevu"
                  className="mt-5 inline-block rounded-full bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all duration-200 hover:opacity-90"
                >
                  Bu hizmet için talep oluştur
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/hizmetler"
            className="inline-block rounded-full border border-border px-8 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-foreground transition-all duration-200 hover:border-accent hover:text-accent"
          >
            Tüm hizmetleri görüntüle
          </Link>
        </div>
      </div>
    </section>
  )
}

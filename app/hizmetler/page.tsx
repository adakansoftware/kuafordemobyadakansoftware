import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { getServicesPageViewModel } from "@/lib/public-site"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Hizmetler",
  description: "Saç kesimi, boyama, keratin bakımı, şekillendirme ve kaynak işlemlerini profesyonel hizmet detaylarıyla inceleyin.",
  path: "/hizmetler",
})

export default function HizmetlerPage() {
  const viewModel = getServicesPageViewModel()

  return (
    <>
      <section className="bg-primary pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">{viewModel.eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-primary-foreground md:text-5xl text-balance">{viewModel.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/70">{viewModel.description}</p>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col gap-24">
            {viewModel.services.map((service, index) => (
              <div
                key={service.slug}
                className={`grid items-center gap-12 lg:grid-cols-2 ${index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] shadow-[0_24px_50px_rgba(28,20,12,0.08)]">
                  <Image src={service.image} alt={service.title} fill className="object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-4">
                    <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">{service.title}</h2>
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">{service.price}</span>
                  </div>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">{service.description}</p>
                  <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                          +
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={viewModel.bookingHref}
                    className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all duration-200 hover:opacity-90"
                  >
                    {viewModel.bookingLabel}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

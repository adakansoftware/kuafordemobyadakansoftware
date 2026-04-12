import Image from "next/image"
import { siteContent } from "@/lib/site-content"

export function IntroSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
            <Image
              src="/images/about-salon.jpg"
              alt="Bella Salon"
              fill
              className="object-cover"
            />
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
              Bella Hakkinda
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-4xl text-balance">
              Guzelligin ve Bakimin Adresi
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              {siteContent.brand.aboutLead}
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {`Kaliteli urunler, deneyimli ekip ve kisiye ozel yaklasimimizla her ziyareti ozel hale getiriyoruz.`}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-6">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-serif text-2xl font-bold text-foreground">100%</p>
                <p className="mt-1 text-sm text-muted-foreground">Musteri Memnuniyeti</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="font-serif text-2xl font-bold text-foreground">Premium</p>
                <p className="mt-1 text-sm text-muted-foreground">Urun ve Hizmet Kalitesi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

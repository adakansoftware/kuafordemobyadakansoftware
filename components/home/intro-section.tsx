import Image from "next/image"
import { siteContent } from "@/lib/site-content"

export function IntroSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[0_24px_60px_rgba(26,20,12,0.1)]">
            <Image
              src="/images/about-salon.jpg"
              alt="Adakan Hair Studio"
              fill
              className="object-cover"
            />
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
              Marka Hakkında
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-foreground md:text-4xl text-balance">
              Saç tasarımını güvenli süreç ve ölçülü estetikle buluşturuyoruz
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              {siteContent.brand.aboutLead}
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {siteContent.brand.aboutDescription}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
                <p className="font-serif text-2xl font-bold text-foreground">Kişiye özel</p>
                <p className="mt-1 text-sm text-muted-foreground">Yüz hattı, saç yapısı ve kullanım alışkanlığı birlikte değerlendirilir.</p>
              </div>
              <div className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
                <p className="font-serif text-2xl font-bold text-foreground">Premium</p>
                <p className="mt-1 text-sm text-muted-foreground">Ürün seçimi, uygulama disiplini ve misafir iletişimi aynı çizgide ilerler.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

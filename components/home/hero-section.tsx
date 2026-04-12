import Image from "next/image"
import Link from "next/link"
import { siteContent } from "@/lib/site-content"

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <Image
        src="/images/hero-salon.jpg"
        alt="Adakan Hair Studio salon iç mekânı"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,17,13,0.42)_0%,rgba(21,17,13,0.78)_75%,rgba(21,17,13,0.88)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(222,177,93,0.28),transparent_36%)]" />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 pt-28 pb-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.32em] text-background/72">
            {siteContent.brand.heroEyebrow}
          </p>
          <h1 className="font-serif text-4xl font-bold leading-tight text-background md:text-6xl lg:text-7xl text-balance">
            {siteContent.brand.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-background/80 text-pretty">
            {siteContent.brand.heroDescription}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {siteContent.brand.heroHighlights.map((item) => (
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
              href="/randevu"
              className="rounded-full bg-accent px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-accent-foreground shadow-[0_14px_30px_rgba(222,177,93,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95"
            >
              Randevu Oluştur
            </Link>
            <Link
              href="/hizmetler"
              className="rounded-full border border-background/30 px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-background transition-all duration-300 hover:bg-background/10"
            >
              Hizmetleri İncele
            </Link>
          </div>
        </div>

        <div className="lg:justify-self-end">
          <div className="rounded-[2rem] border border-white/14 bg-white/10 p-6 text-background shadow-[0_24px_60px_rgba(10,8,5,0.22)] backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.24em] text-background/68">Salon Notu</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-balance">{siteContent.brand.tagline}</h2>
            <p className="mt-4 text-sm leading-relaxed text-background/72">
              İlk temastan son dokunuşa kadar net iletişim, düzenli operasyon ve profesyonel saç tasarımı odağını
              birlikte koruyoruz.
            </p>
            <div className="mt-6 grid gap-4 border-t border-white/12 pt-5 sm:grid-cols-3 lg:grid-cols-1">
              <div>
                <div className="font-serif text-3xl font-bold">09:00 - 21:00</div>
                <div className="mt-1 text-sm text-background/68">Hafta içi ve cumartesi çalışma saatleri</div>
              </div>
              <div>
                <div className="font-serif text-3xl font-bold">4.9/5</div>
                <div className="mt-1 text-sm text-background/68">Ortalama misafir değerlendirmesi</div>
              </div>
              <div>
                <div className="font-serif text-3xl font-bold">15 kişilik</div>
                <div className="mt-1 text-sm text-background/68">Alanında uzman ekip yapılanması</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

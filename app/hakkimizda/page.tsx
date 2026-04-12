import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Award, Settings, ShieldCheck, Sparkles } from "lucide-react"
import { buildMetadata } from "@/lib/seo"
import { siteContent } from "@/lib/site-content"

export const metadata: Metadata = buildMetadata({
  title: "Hakkımızda",
  description: "Adakan Hair Studio ekibini, hizmet yaklaşımını ve salon değerlerini yakından inceleyin.",
  path: "/hakkimizda",
})

const valueIcons = [Sparkles, Award, ShieldCheck, Settings]

export default function HakkimizdaPage() {
  return (
    <>
      <section className="bg-primary pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Hakkımızda</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-primary-foreground md:text-5xl text-balance">
            Hikayemiz
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/70">
            Butik salon deneyimini teknik uzmanlık, sakin iletişim ve özenli bakım anlayışıyla birleştiriyoruz.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-[0_24px_50px_rgba(28,20,12,0.08)]">
              <Image src="/images/about-salon.jpg" alt="Adakan Hair Studio" fill className="object-cover" />
            </div>
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl text-balance">
                Güzelliğe özenli ve profesyonel bir yaklaşım
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">{siteContent.brand.aboutLead}</p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{siteContent.brand.aboutDescription}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Değerlerimiz</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-foreground md:text-4xl text-balance">
              Temel değerlerimiz
            </h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {siteContent.values.map((value, index) => {
              const Icon = valueIcons[index]

              return (
                <div key={value.title} className="rounded-[1.5rem] border border-border bg-card p-6 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {siteContent.team.map((member) => (
              <div key={member.name} className="group overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-sm">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
                  <p className="text-sm font-medium text-accent">{member.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl text-balance">
            Ekibimizle tanışmak ister misiniz?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            İhtiyacınıza uygun hizmeti birlikte planlamak için hemen randevu talebinizi oluşturun.
          </p>
          <Link
            href="/randevu"
            className="mt-8 inline-block rounded-full bg-primary px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-all duration-200 hover:opacity-90"
          >
            Randevu oluştur
          </Link>
        </div>
      </section>
    </>
  )
}

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Award, Sparkles, ShieldCheck, Settings } from "lucide-react"
import { siteContent } from "@/lib/site-content"

export const metadata: Metadata = {
  title: "Hakkimizda | Bella Sac ve Guzellik Salonu",
  description: "Salonumuz, ekibimiz ve hizmet anlayisimiz hakkinda bilgi alin.",
}

const valueIcons = [Sparkles, Award, ShieldCheck, Settings]

export default function HakkimizdaPage() {
  return (
    <>
      <section className="bg-primary pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Hakkimizda</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-primary-foreground md:text-5xl text-balance">Hikayemiz</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/70">Butik salon deneyimini kalite ve ozenle birlestiriyoruz.</p>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
              <Image src="/images/about-salon.jpg" alt="Bella Salon" fill className="object-cover" />
            </div>
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl text-balance">Guzellige Adanmis Bir Yaklasim</h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">{siteContent.brand.aboutLead}</p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">Amacimiz, her musterinin kendine en uygun bakim ve stil secenekleriyle salonumuzdan memnun ayrilmasi.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-secondary">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Degerlerimiz</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-foreground md:text-4xl text-balance">Temel Degerlerimiz</h2>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {siteContent.values.map((value, index) => {
              const Icon = valueIcons[index]

              return (
                <div key={value.title} className="text-center rounded-lg border border-border bg-card p-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent"><Icon className="h-6 w-6" /></div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {siteContent.team.map((member) => (
              <div key={member.name} className="group overflow-hidden rounded-lg border border-border bg-card">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image src={member.image} alt={member.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
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
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl text-balance">Ekibimizle Tanismak Ister misiniz?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">Hemen randevu alarak salon deneyimini yakindan tanimlayin.</p>
          <Link href="/randevu" className="mt-8 inline-block rounded-sm bg-primary px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all duration-200 hover:opacity-90">Randevu Al</Link>
        </div>
      </section>
    </>
  )
}

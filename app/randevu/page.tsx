import type { Metadata } from "next"
import { BookingForm } from "@/components/booking-form"
import { Phone, MapPin, Clock } from "lucide-react"
import { siteContent } from "@/lib/site-content"

export const metadata: Metadata = {
  title: "Randevu Al | Bella Sac ve Guzellik Salonu",
  description: "Online randevu olusturun ve ekibimizle kolayca iletisime gecin.",
}

export default function RandevuPage() {
  return (
    <>
      <section className="bg-primary pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Randevu</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-primary-foreground md:text-5xl text-balance">Online Randevu Al</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/70">
            Formu doldurun, ekibimiz en kisa surede sizinle iletisime gecsin.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2"><BookingForm /></div>

            <div className="flex flex-col gap-6">
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-serif text-lg font-bold text-foreground">Iletisim Bilgileri</h3>
                <ul className="mt-4 space-y-4">
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Telefon</p>
                      <a href={siteContent.contact.phoneHref} className="text-sm text-muted-foreground hover:text-accent">{siteContent.contact.phoneDisplay}</a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Adres</p>
                      <p className="text-sm text-muted-foreground">{siteContent.contact.address}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Calisma Saatleri</p>
                      {siteContent.contact.hours.map((item) => (
                        <p key={item.label} className="text-sm text-muted-foreground">{item.label}: {item.value}</p>
                      ))}
                    </div>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-accent/20 bg-accent/5 p-6">
                <h3 className="font-serif text-lg font-bold text-foreground">Bilgilendirme</h3>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  <li>- Randevunuzu 24 saat oncesine kadar degistirebilirsiniz.</li>
                  <li>- Ilk ziyaretiniz icin ozel kampanyalar sunuyoruz.</li>
                  <li>- Lutfen randevu saatinizden 10 dakika once salonda olun.</li>
                </ul>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <iframe
                  src={siteContent.contact.mapEmbed}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={siteContent.contact.mapTitle}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

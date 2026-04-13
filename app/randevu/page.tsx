import type { Metadata } from "next"
import { Clock, MapPin, Phone, ShieldCheck } from "lucide-react"
import { BookingForm } from "@/components/booking-form"
import { getBookingPageViewModel } from "@/lib/public-site"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Online Randevu",
  description: "Adakan Hair Studio için online randevu talebi oluşturun, uygun hizmet ve saati birkaç adımda planlayın.",
  path: "/randevu",
})

export default function RandevuPage() {
  const viewModel = getBookingPageViewModel()

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
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <BookingForm />
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
                <h3 className="font-serif text-lg font-bold text-foreground">İletişim bilgileri</h3>
                <ul className="mt-4 space-y-4">
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Telefon</p>
                      <a href={viewModel.contact.phoneHref} className="text-sm text-muted-foreground hover:text-accent">
                        {viewModel.contact.phoneDisplay}
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Adres</p>
                      <p className="text-sm text-muted-foreground">{viewModel.contact.address}</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Çalışma saatleri</p>
                      {viewModel.contact.hours.map((item) => (
                        <p key={item.label} className="text-sm text-muted-foreground">
                          {item.label}: {item.value}
                        </p>
                      ))}
                    </div>
                  </li>
                </ul>
              </div>

              <div className="rounded-[1.75rem] border border-accent/20 bg-accent/5 p-6">
                <h3 className="font-serif text-lg font-bold text-foreground">Randevu bilgilendirmesi</h3>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {viewModel.notes.map((note) => (
                    <li key={note}>- {note}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-5 w-5 text-accent" />
                  <div>
                    <h3 className="font-serif text-lg font-bold text-foreground">Güven ve süreç</h3>
                    <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                      {viewModel.trustPoints.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-border shadow-sm">
                <iframe
                  src={viewModel.contact.mapEmbed}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={viewModel.contact.mapTitle}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

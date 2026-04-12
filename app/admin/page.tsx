import type { Metadata } from "next"
import { getAppointmentMetrics, getBusinessSettings, listAppointments, listServicesFromDb, listStaffFromDb } from "@/lib/bookings-repository"

export const metadata: Metadata = {
  title: "Admin | Bella Sac ve Guzellik Salonu",
  description: "Demo operasyon paneli ve randevu kayitlari.",
}

export default async function AdminPage() {
  const [settings, metrics, appointments, services, staff] = await Promise.all([
    getBusinessSettings(),
    getAppointmentMetrics(),
    listAppointments(),
    listServicesFromDb(),
    listStaffFromDb(),
  ])

  return (
    <>
      <section className="bg-primary pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Demo Admin</p>
          <h1 className="mt-3 font-serif text-4xl font-bold text-primary-foreground md:text-5xl text-balance">
            {settings?.businessName ?? "Salon Operasyon Merkezi"}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-primary-foreground/70">
            Bu panel, satis sonrasi cekirdek sistemin canliya alinmis bir salonda nasil gorunecegini gostermek icin hazirlandi.
            Randevu kayitlari Neon Postgres uzerine yaziliyor.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Toplam Randevu" value={String(metrics.totalAppointments)} />
            <MetricCard label="Bugunku Randevu" value={String(metrics.todaysAppointments)} />
            <MetricCard label="Yeni Talep" value={String(metrics.newAppointments)} />
            <MetricCard label="Onayli" value={String(metrics.confirmedAppointments)} />
            <MetricCard label="Tamamlandi" value={String(metrics.completedAppointments)} />
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.8fr_1fr]">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground">Randevu Akisi</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Musteri, hizmet ve zaman bilgileri ayni cekirdek veritabani katmaninda tutulur.
                  </p>
                </div>
                <div className="rounded-full bg-secondary px-4 py-2 text-sm text-foreground">
                  {appointments.length} kayit
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="pb-3 font-medium">Musteri</th>
                      <th className="pb-3 font-medium">Hizmet</th>
                      <th className="pb-3 font-medium">Plan</th>
                      <th className="pb-3 font-medium">Kaynak</th>
                      <th className="pb-3 font-medium">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length ? (
                      appointments.map((appointment) => (
                        <tr key={appointment.id} className="border-b border-border/70 align-top">
                          <td className="py-4">
                            <div className="font-medium text-foreground">{appointment.customer.name}</div>
                            <div className="text-muted-foreground">{appointment.customer.phone}</div>
                            <div className="text-muted-foreground">{appointment.customer.email}</div>
                          </td>
                          <td className="py-4">
                            <div className="font-medium text-foreground">{appointment.service.title}</div>
                            <div className="text-muted-foreground">{appointment.staff?.name ?? "Atanacak"}</div>
                          </td>
                          <td className="py-4 text-foreground">
                            {appointment.scheduledDate} / {appointment.scheduledTime}
                          </td>
                          <td className="py-4 text-muted-foreground">{appointment.source}</td>
                          <td className="py-4">
                            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                              {appointment.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-muted-foreground">
                          Henuz randevu kaydi yok. Randevu formundan ilk talebi gondererek sistemi test edebilirsiniz.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-2xl font-bold text-foreground">Cekirdek Durumu</h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <li>Neon Postgres veritabani baglantisi aktif.</li>
                  <li>Prisma schema, seed ve repository katmani hazir.</li>
                  <li>Server action ve API ayni veri katmanina bagli calisiyor.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-2xl font-bold text-foreground">Servisler</h2>
                <div className="mt-4 space-y-3">
                  {services.map((service) => (
                    <div key={service.id} className="rounded-xl bg-secondary px-4 py-3">
                      <div className="font-medium text-foreground">{service.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {service.durationMinutes} dk / {service.priceLabel}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-2xl font-bold text-foreground">Ekip</h2>
                <div className="mt-4 space-y-3">
                  {staff.map((person) => (
                    <div key={person.id} className="rounded-xl bg-secondary px-4 py-3">
                      <div className="font-medium text-foreground">{person.name}</div>
                      <div className="text-sm text-muted-foreground">{person.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-serif text-4xl font-bold text-foreground">{value}</p>
    </div>
  )
}

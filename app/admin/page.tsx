import type { Metadata } from "next"
import { AppointmentOperations } from "@/components/admin/appointment-operations"
import {
  getAppointmentMetrics,
  getBusinessSettings,
  getOperationalAlerts,
  getStaffWorkload,
  listAppointments,
  listServicesFromDb,
  listStaffFromDb,
} from "@/lib/bookings-repository"

export const metadata: Metadata = {
  title: "Admin | Bella Sac ve Guzellik Salonu",
  description: "Demo operasyon paneli ve randevu kayitlari.",
}

export default async function AdminPage() {
  const [settings, metrics, alerts, appointments, services, staff, staffWorkload] = await Promise.all([
    getBusinessSettings(),
    getAppointmentMetrics(),
    getOperationalAlerts(),
    listAppointments(),
    listServicesFromDb(),
    listStaffFromDb(),
    getStaffWorkload(),
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
            Bu panel, satis sonrasi cekirdek sistemin canliya alinmis bir salonda nasil gorunecegini gostermek icin
            hazirlandi. Randevu kayitlari Neon Postgres uzerine yaziliyor ve operasyon adimlari ayni panelden
            yonetiliyor.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Toplam Randevu" value={String(metrics.totalAppointments)} />
            <MetricCard label="Bugunku Randevu" value={String(metrics.todaysAppointments)} />
            <MetricCard label="Yeni Talep" value={String(metrics.newAppointments)} />
            <MetricCard label="Onayli" value={String(metrics.confirmedAppointments)} />
            <MetricCard label="Tamamlandi" value={String(metrics.completedAppointments)} />
            <MetricCard label="Iptal" value={String(metrics.cancelledAppointments)} />
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground">Canli Operasyon Akisi</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      Randevu durumunu degistirin, personel atayin ve not ekleyin. Sistem personel cakismalarini ve dolu
                      saatleri otomatik olarak korur.
                    </p>
                  </div>
                  <div className="rounded-full bg-secondary px-4 py-2 text-sm text-foreground">
                    {appointments.length} kayit
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {appointments.length ? (
                    appointments.map((appointment) => (
                      <AppointmentOperations
                        key={appointment.id}
                        appointment={appointment}
                        staffOptions={staff.map((person) => ({
                          id: person.id,
                          name: person.name,
                          role: person.role,
                        }))}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
                      Henuz randevu kaydi yok. Randevu formundan ilk talebi gondererek sistemi test edebilirsiniz.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <PanelCard
                title="Operasyon Uyarilari"
                items={[
                  `${alerts.unassignedActiveAppointments} aktif kayit henuz personele atanmadi.`,
                  `${alerts.staleRequests} yeni talep 30 dakikadan uzun suredir isleme alinmadi.`,
                  `Bugun ${alerts.todaysLoad} aktif randevu planlandi.`,
                  `Ekip kapasitesi bugun yaklasik ${alerts.todayCapacity} yarim saatlik slot seviyesinde.`,
                ]}
              />

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-2xl font-bold text-foreground">Ekip Yuk Dagilimi</h2>
                <div className="mt-4 space-y-3">
                  {staffWorkload.map((person) => (
                    <div key={person.id} className="rounded-xl bg-secondary px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium text-foreground">{person.name}</div>
                          <div className="text-sm text-muted-foreground">{person.role}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-serif text-2xl font-bold text-foreground">{person.activeAppointments}</div>
                          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">aktif</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-2xl font-bold text-foreground">Servis Katalogu</h2>
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

              <PanelCard
                title="Cekirdek Durumu"
                items={[
                  "Neon Postgres veritabani baglantisi aktif.",
                  "Prisma schema, seed ve repository katmani canli veri akisini destekliyor.",
                  "Public form, API ve admin panel ayni veri kurallarini kullaniyor.",
                ]}
              />
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

function PanelCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-serif text-2xl font-bold text-foreground">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

import type { Metadata } from "next"
import type { ReactNode } from "react"
import { AppointmentStatus } from "@prisma/client"
import { AppointmentOperations } from "@/components/admin/appointment-operations"
import {
  getAppointmentMetrics,
  getBusinessSettings,
  getCustomerInsights,
  getFollowUpQueue,
  getOperationalAlerts,
  getServicePerformance,
  getStaffWorkload,
  getUpcomingAgenda,
  listAppointments,
  listStaffFromDb,
} from "@/lib/bookings-repository"
import { requireAdminAccess } from "@/lib/security"
import { siteContent } from "@/lib/site-content"

export const metadata: Metadata = {
  title: "Admin | Adakan Hair Studio",
  description: "Operasyon paneli, randevu kayıtları ve salon yönetim ekranı.",
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = "force-dynamic"

type AdminPageProps = {
  searchParams?: Promise<{
    q?: string
    status?: string
    staff?: string
    page?: string
  }>
}

const statusLabels: Record<AppointmentStatus, string> = {
  NEW: siteContent.admin.statusLabels.NEW,
  CONFIRMED: siteContent.admin.statusLabels.CONFIRMED,
  COMPLETED: siteContent.admin.statusLabels.COMPLETED,
  CANCELLED: siteContent.admin.statusLabels.CANCELLED,
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  await requireAdminAccess()

  const resolvedSearchParams = (await searchParams) ?? {}
  const query = (resolvedSearchParams.q ?? "").trim()
  const statusFilter = normalizeStatusFilter(resolvedSearchParams.status)
  const staffFilter = (resolvedSearchParams.staff ?? "all").trim() || "all"
  const page = normalizePageParam(resolvedSearchParams.page)

  const [
    settings,
    metrics,
    alerts,
    staff,
    staffWorkload,
    customerInsights,
    servicePerformance,
    upcomingAgenda,
    followUpQueue,
    appointments,
  ] = await Promise.all([
    getBusinessSettings(),
    getAppointmentMetrics(),
    getOperationalAlerts(),
    listStaffFromDb(),
    getStaffWorkload(),
    getCustomerInsights(),
    getServicePerformance(),
    getUpcomingAgenda(),
    getFollowUpQueue(),
    listAppointments(
      {
        search: query,
        status: statusFilter,
        staffId: staffFilter,
      },
      {
        page,
        pageSize: 25,
      }
    ),
  ])

  const capacityUsage = Math.min(100, Math.round((alerts.todaysLoad / Math.max(alerts.todayCapacity, 1)) * 100))
  const filteredSummary = [
    query ? `Arama: "${query}"` : "Tüm kayıtlar",
    statusFilter === "ALL" ? "Tüm durumlar" : `${statusLabels[statusFilter]} durumundakiler`,
    staffFilter === "all"
      ? "Tüm ekip"
      : staffFilter === "unassigned"
        ? "Atanmamış randevular"
        : `${staff.find((person) => person.id === staffFilter)?.name ?? "Seçili personel"}`,
  ]

  const bestPerformingService = [...servicePerformance].sort((a, b) => b.completedAppointments - a.completedAppointments)[0]
  const mostLoadedStaff = [...staffWorkload].sort((a, b) => b.activeAppointments - a.activeAppointments)[0]

  return (
    <>
      <section className="bg-primary pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">Operasyon Paneli</p>
              <h1 className="mt-3 font-serif text-4xl font-bold text-primary-foreground md:text-5xl text-balance">
                {settings?.businessName ?? "Salon Operasyon Merkezi"}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-primary-foreground/75">
                Operasyon, ekip, müşteri ve gelir sinyallerini aynı ekranda toplayan bu panel; salonun günlük
                yönetimini canlı kullanım seviyesinde sürdürmek için tasarlandı.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HighlightCard label="Bugünkü Operasyon" value={`${alerts.todaysLoad}`} caption="aktif plan" />
              <HighlightCard label="Kapasite Kullanımı" value={`${capacityUsage}%`} caption={`${alerts.todayCapacity} slot kapasite`} />
              <HighlightCard label="Takip Sırası" value={`${followUpQueue.length}`} caption="hemen ilgilenilecek kayıt" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Toplam Randevu" value={String(metrics.totalAppointments)} />
            <MetricCard label="Bugünkü Randevu" value={String(metrics.todaysAppointments)} />
            <MetricCard label="Yeni Talep" value={String(metrics.newAppointments)} />
            <MetricCard label="Onaylı" value={String(metrics.confirmedAppointments)} />
            <MetricCard label="Tamamlandı" value={String(metrics.completedAppointments)} />
            <MetricCard label="İptal" value={String(metrics.cancelledAppointments)} />
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <InsightCard
                  title="Servis Lideri"
                  value={bestPerformingService?.title ?? "Veri bekleniyor"}
                  subtitle={
                    bestPerformingService
                      ? `${bestPerformingService.completedAppointments} tamamlanan işlem / tahmini ${formatCurrency(bestPerformingService.estimatedRevenue)}`
                      : "Tamamlanan işlem verisi henüz oluşmadı."
                  }
                />
                <InsightCard
                  title="En Yoğun Personel"
                  value={mostLoadedStaff?.name ?? "Planlama bekleniyor"}
                  subtitle={
                    mostLoadedStaff
                      ? `${mostLoadedStaff.activeAppointments} aktif randevu / ${mostLoadedStaff.role}`
                      : "Aktif randevu ataması bekleniyor."
                  }
                />
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground">Canlı Operasyon Akışı</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      Randevu durumunu değiştirin, personel atayın, not bırakın ve kayıtları arama ya da filtrelerle
                      hızlı şekilde bulun. Sistem çakışma ve dolu saat kontrollerini arka planda korur.
                    </p>
                  </div>
                  <div className="rounded-full bg-secondary px-4 py-2 text-sm text-foreground">
                    {appointments.total} kayıt bulundu
                  </div>
                </div>

                <form className="mt-6 grid gap-3 rounded-2xl border border-border/80 bg-secondary/40 p-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto_auto]">
                  <label className="grid gap-2 text-sm text-foreground">
                    <span className="font-medium">Ara</span>
                    <input
                      type="search"
                      name="q"
                      defaultValue={query}
                      placeholder="Müşteri, telefon, e-posta veya hizmet ara"
                      className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                  </label>

                  <label className="grid gap-2 text-sm text-foreground">
                    <span className="font-medium">Durum</span>
                    <select
                      name="status"
                      defaultValue={statusFilter}
                      className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                    >
                      <option value="ALL">Tüm durumlar</option>
                      <option value="NEW">Yeni</option>
                      <option value="CONFIRMED">Onaylı</option>
                      <option value="COMPLETED">Tamamlandı</option>
                      <option value="CANCELLED">İptal</option>
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm text-foreground">
                    <span className="font-medium">Personel</span>
                    <select
                      name="staff"
                      defaultValue={staffFilter}
                      className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                    >
                      <option value="all">Tüm ekip</option>
                      <option value="unassigned">Atanmamış</option>
                      {staff.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="flex items-end gap-3">
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      Filtrele
                    </button>
                  </div>

                  <div className="flex items-end gap-3">
                    <a
                      href="/admin"
                      className="w-full rounded-xl border border-input bg-background px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-accent"
                    >
                      Sıfırla
                    </a>
                  </div>
                </form>

                <div className="mt-4 flex flex-wrap gap-2">
                  {filteredSummary.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-6 space-y-4">
                  {appointments.items.length ? (
                    appointments.items.map((appointment) => (
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
                      Seçili filtrelerle eşleşen randevu bulunamadı. Arama terimini veya filtreleri değiştirerek devam
                      edebilirsiniz.
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border/80 bg-secondary/30 px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Sayfa {appointments.page} / {appointments.totalPages} · Bu sayfada {appointments.items.length} kayıt
                  </div>

                  <div className="flex gap-3">
                    <PaginationLink
                      href={buildAdminPageHref({
                        query,
                        status: statusFilter,
                        staff: staffFilter,
                        page: appointments.page - 1,
                      })}
                      disabled={appointments.page <= 1}
                    >
                      Önceki
                    </PaginationLink>
                    <PaginationLink
                      href={buildAdminPageHref({
                        query,
                        status: statusFilter,
                        staff: staffFilter,
                        page: appointments.page + 1,
                      })}
                      disabled={appointments.page >= appointments.totalPages}
                    >
                      Sonraki
                    </PaginationLink>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground">Yaklaşan Ajanda</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Sonraki aktif randevular ekip ve müşteri bilgisiyle birlikte listelenir.
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-4 py-2 text-sm text-foreground">
                    {upcomingAgenda.length} plan
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {upcomingAgenda.map((appointment) => (
                    <div key={appointment.id} className="rounded-xl bg-secondary px-4 py-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-medium text-foreground">{appointment.customer.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {appointment.service.title} / {appointment.scheduledDate} / {appointment.scheduledTime}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">{appointment.staff?.name ?? "Atama bekliyor"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <PanelCard
                title="Operasyon Uyarıları"
                items={[
                  `${alerts.unassignedActiveAppointments} aktif kayıt henüz personele atanmadı.`,
                  `${alerts.staleRequests} yeni talep 30 dakikadan uzun süredir işleme alınmadı.`,
                  `Bugün ${alerts.todaysLoad} aktif randevu planlandı.`,
                  `Ekip kapasitesi bugün yaklaşık ${alerts.todayCapacity} yarım saatlik slot seviyesinde.`,
                ]}
              />

              <TonePanel title="Takip Sırası">
                <div className="space-y-3">
                  {followUpQueue.length ? (
                    followUpQueue.map((item) => (
                      <div key={item.id} className={`rounded-xl px-4 py-3 ${getToneClass(item.tone)}`}>
                        <div className="font-medium">{item.title}</div>
                        <div className="mt-1 text-sm opacity-80">{item.description}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
                      Şu an acil takip gerektiren kayıt görünmüyor.
                    </div>
                  )}
                </div>
              </TonePanel>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-2xl font-bold text-foreground">Müşteri Geçmişi</h2>
                <div className="mt-4 space-y-3">
                  {customerInsights.map((customer) => (
                    <div key={customer.id} className="rounded-xl bg-secondary px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium text-foreground">{customer.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{customer.phone ?? "Telefon yok"}</div>
                          <div className="text-sm text-muted-foreground">{customer.email ?? "E-posta yok"}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-serif text-2xl font-bold text-foreground">{customer.totalAppointments}</div>
                          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">toplam ziyaret</div>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        <p>Aktif plan: {customer.activeAppointments}</p>
                        <p>Tamamlanan hizmet: {customer.completedAppointments}</p>
                        <p>
                          Son kayıt:{" "}
                          {customer.latestAppointment
                            ? `${customer.latestAppointment.serviceTitle} / ${customer.latestAppointment.scheduledDate} / ${customer.latestAppointment.scheduledTime}`
                            : "Henüz yok"}
                        </p>
                        <p>Son atama: {customer.latestAppointment?.staffName ?? "Atama kaydı bulunmuyor"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-2xl font-bold text-foreground">Servis Performansı</h2>
                <div className="mt-4 space-y-3">
                  {servicePerformance.map((service) => (
                    <div key={service.id} className="rounded-xl bg-secondary px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium text-foreground">{service.title}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{service.teaser}</div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{service.durationMinutes} dk</div>
                          <div>{service.priceLabel}</div>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-1 text-sm text-muted-foreground">
                        <p>Toplam talep: {service.totalAppointments}</p>
                        <p>Aktif plan: {service.activeAppointments}</p>
                        <p>Tamamlanan: {service.completedAppointments}</p>
                        <p>Tahmini tamamlanan gelir: {formatCurrency(service.estimatedRevenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-2xl font-bold text-foreground">Ekip Yük Dağılımı</h2>
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

              <PanelCard
                title="Çekirdek Durumu"
                items={[
                  "Neon Postgres veritabanı bağlantısı aktif.",
                  "Public form, API ve admin panel aynı veri kurallarını kullanıyor.",
                  "Ajanda, müşteri geçmişi, servis performansı ve takip sırası tek panelde yönetiliyor.",
                ]}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function normalizeStatusFilter(value?: string) {
  if (value === "NEW" || value === "CONFIRMED" || value === "COMPLETED" || value === "CANCELLED") {
    return value
  }

  return "ALL"
}

function normalizePageParam(value?: string) {
  const page = Number(value)

  if (!Number.isFinite(page)) {
    return 1
  }

  return Math.max(Math.floor(page), 1)
}

function buildAdminPageHref(input: {
  query: string
  status: "ALL" | AppointmentStatus
  staff: string
  page: number
}) {
  const params = new URLSearchParams()

  if (input.query) {
    params.set("q", input.query)
  }

  if (input.status !== "ALL") {
    params.set("status", input.status)
  }

  if (input.staff !== "all") {
    params.set("staff", input.staff)
  }

  if (input.page > 1) {
    params.set("page", String(input.page))
  }

  const query = params.toString()
  return query ? `/admin?${query}` : "/admin"
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value)
}

function getToneClass(tone: "warning" | "accent" | "success") {
  if (tone === "warning") {
    return "bg-amber-500/10 text-amber-800"
  }

  if (tone === "success") {
    return "bg-emerald-500/10 text-emerald-800"
  }

  return "bg-sky-500/10 text-sky-800"
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-serif text-4xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function HighlightCard({
  label,
  value,
  caption,
}: {
  label: string
  value: string
  caption: string
}) {
  return (
    <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">{label}</p>
      <p className="mt-2 font-serif text-3xl font-bold text-primary-foreground">{value}</p>
      <p className="mt-1 text-sm text-primary-foreground/70">{caption}</p>
    </div>
  )
}

function InsightCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string
  subtitle: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <p className="mt-3 font-serif text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function TonePanel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-serif text-2xl font-bold text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
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

function PaginationLink({
  href,
  disabled,
  children,
}: {
  href: string
  disabled: boolean
  children: ReactNode
}) {
  const className = disabled
    ? "pointer-events-none rounded-xl border border-input bg-background px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground opacity-50"
    : "rounded-xl border border-input bg-background px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-accent"

  return (
    <a aria-disabled={disabled} href={href} className={className}>
      {children}
    </a>
  )
}

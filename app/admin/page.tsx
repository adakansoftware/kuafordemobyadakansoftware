import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { AppointmentStatus } from "@prisma/client"
import { AppointmentOperations } from "@/components/admin/appointment-operations"
import { BusinessSettingsForm } from "@/components/admin/business-settings-form"
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
import {
  getActivePackages,
  getDailyCalendarView,
  getEndOfDaySummary,
  getStaffCommissionSummary,
  getUnpaidCompletedAppointments,
} from "@/lib/salon-ops-repository"
import { siteContent } from "@/lib/site-content"

export const metadata: Metadata = {
  title: "Admin | Adakan Hair Studio",
  description: "Kuafor randevu, odeme, musteri ve operasyon yonetim merkezi.",
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
    day?: string
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
  const selectedDay = normalizeDateParam(resolvedSearchParams.day)

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
    unpaidCompletedAppointments,
    endOfDaySummary,
    staffCommissionSummary,
    activePackages,
    calendarView,
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
    getUnpaidCompletedAppointments(),
    getEndOfDaySummary(),
    getStaffCommissionSummary(),
    getActivePackages(),
    getDailyCalendarView(selectedDay),
  ])

  const capacityUsage = Math.min(100, Math.round((alerts.todaysLoad / Math.max(settings?.dailyCapacity ?? alerts.todayCapacity, 1)) * 100))
  const filteredSummary = [
    query ? `Arama: "${query}"` : "Tum kayitlar",
    statusFilter === "ALL" ? "Tum durumlar" : `${statusLabels[statusFilter]} durumundakiler`,
    staffFilter === "all"
      ? "Tum ekip"
      : staffFilter === "unassigned"
        ? "Atanmamis randevular"
        : `${staff.find((person) => person.id === staffFilter)?.name ?? "Secili personel"}`,
  ]

  const bestPerformingService = [...servicePerformance].sort((a, b) => b.completedAppointments - a.completedAppointments)[0]
  const mostLoadedStaff = [...staffWorkload].sort((a, b) => b.activeAppointments - a.activeAppointments)[0]
  const workingHoursNote =
    settings?.workingHours && typeof settings.workingHours === "object" && "note" in settings.workingHours
      ? String(settings.workingHours.note ?? "")
      : ""

  const calendarTimes = Array.from(
    new Set(calendarView.appointments.map((appointment) => appointment.scheduledTime))
  ).sort()

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
                Randevu, odeme, musteri, personel primi ve gun sonu raporu ayni ekranda yonetilir.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <HighlightCard label="Bugunku Operasyon" value={`${alerts.todaysLoad}`} caption="aktif plan" />
              <HighlightCard label="Gun Sonu Ciro" value={formatCurrency(endOfDaySummary.revenueTotal)} caption="bugun tahsil edilen" />
              <HighlightCard label="Bekleyen Odeme" value={`${endOfDaySummary.pendingPaymentCount}`} caption={formatCurrency(endOfDaySummary.pendingPaymentAmount)} />
              <HighlightCard label="Kapasite Kullanim" value={`${capacityUsage}%`} caption={`${settings?.dailyCapacity ?? alerts.todayCapacity} slot`} />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl space-y-10 px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Toplam Randevu" value={String(metrics.totalAppointments)} />
            <MetricCard label="Bugunku Randevu" value={String(metrics.todaysAppointments)} />
            <MetricCard label="Yeni Talep" value={String(metrics.newAppointments)} />
            <MetricCard label="Onayli" value={String(metrics.confirmedAppointments)} />
            <MetricCard label="Tamamlandi" value={String(metrics.completedAppointments)} />
            <MetricCard label="Iptal" value={String(metrics.cancelledAppointments)} />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <PanelCard
              title="Gun Sonu Ozeti"
              items={[
                `Bugunku ciro: ${formatCurrency(endOfDaySummary.revenueTotal)}`,
                `Nakit: ${formatCurrency(endOfDaySummary.cashTotal)}`,
                `Kart: ${formatCurrency(endOfDaySummary.cardTotal)}`,
                `IBAN: ${formatCurrency(endOfDaySummary.ibanTotal)}`,
                `Bekleyen odeme: ${formatCurrency(endOfDaySummary.pendingPaymentAmount)}`,
                `Tamamlanan randevu: ${endOfDaySummary.completedAppointments}`,
                `Iptal orani: %${endOfDaySummary.cancelRate}`,
                `En cok kazandiran hizmet: ${endOfDaySummary.topService?.title ?? "Veri bekleniyor"}`,
                `En cok calisan personel: ${endOfDaySummary.topStaff?.name ?? "Veri bekleniyor"}`,
              ]}
            />

            <InsightCard
              title="Servis Lideri"
              value={bestPerformingService?.title ?? "Veri bekleniyor"}
              subtitle={
                bestPerformingService
                  ? `${bestPerformingService.completedAppointments} tamamlanan islem / tahmini ${formatCurrency(bestPerformingService.estimatedRevenue)}`
                  : "Tamamlanan hizmet verisi henuz olusmadi."
              }
            />

            <InsightCard
              title="En Yogun Personel"
              value={mostLoadedStaff?.name ?? "Planlama bekleniyor"}
              subtitle={
                mostLoadedStaff
                  ? `${mostLoadedStaff.activeAppointments} aktif randevu / ${mostLoadedStaff.role}`
                  : "Aktif randevu atamasi bekleniyor."
              }
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.75fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground">Odenmemis Tamamlanan Randevular</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Tahsilat bekleyen tamamlanmis kayitlar, odeme aksiyonuna hizli giris icin ayrica listelenir.
                    </p>
                  </div>
                  <span className="rounded-full bg-background px-4 py-2 text-sm text-foreground">
                    {unpaidCompletedAppointments.length} kayit
                  </span>
                </div>

                <div className="mt-4 grid gap-3">
                  {unpaidCompletedAppointments.length ? (
                    unpaidCompletedAppointments.map((appointment) => (
                      <div key={appointment.id} className="rounded-xl bg-background px-4 py-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="font-medium text-foreground">{appointment.customer.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {appointment.service.title} / {appointment.scheduledDate} / {appointment.scheduledTime}
                            </div>
                          </div>
                          <div className="text-sm font-medium text-amber-800">
                            Bekleyen tahsilat: {formatCurrency(appointment.service.priceFrom)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-background px-4 py-4 text-sm text-muted-foreground">
                      Su anda bekleyen odeme gorunmuyor.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground">Canli Operasyon Akisi</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      Mevcut randevu listesi korunur; durum, personel, odeme ve WhatsApp aksiyonlari ayni kayit uzerinden yonetilir.
                    </p>
                  </div>
                  <div className="rounded-full bg-secondary px-4 py-2 text-sm text-foreground">
                    {appointments.total} kayit bulundu
                  </div>
                </div>

                <form className="mt-6 grid gap-3 rounded-2xl border border-border/80 bg-secondary/40 p-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto_auto]">
                  <label className="grid gap-2 text-sm text-foreground">
                    <span className="font-medium">Ara</span>
                    <input
                      type="search"
                      name="q"
                      defaultValue={query}
                      placeholder="Musteri, telefon, e-posta veya hizmet ara"
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
                      <option value="ALL">Tum durumlar</option>
                      <option value="NEW">Yeni</option>
                      <option value="CONFIRMED">Onayli</option>
                      <option value="COMPLETED">Tamamlandi</option>
                      <option value="CANCELLED">Iptal</option>
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm text-foreground">
                    <span className="font-medium">Personel</span>
                    <select
                      name="staff"
                      defaultValue={staffFilter}
                      className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                    >
                      <option value="all">Tum ekip</option>
                      <option value="unassigned">Atanmamis</option>
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
                      Sifirla
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
                        businessName={settings?.businessName ?? "Adakan Hair Studio"}
                        staffOptions={staff.map((person) => ({
                          id: person.id,
                          name: person.name,
                          role: person.role,
                        }))}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
                      Secili filtrelerle eslesen randevu bulunamadi.
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border/80 bg-secondary/30 px-4 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground">
                    Sayfa {appointments.page} / {appointments.totalPages} - Bu sayfada {appointments.items.length} kayit
                  </div>

                  <div className="flex gap-3">
                    <PaginationLink
                      href={buildAdminPageHref({
                        query,
                        status: statusFilter,
                        staff: staffFilter,
                        page: appointments.page - 1,
                        day: selectedDay,
                      })}
                      disabled={appointments.page <= 1}
                    >
                      Onceki
                    </PaginationLink>
                    <PaginationLink
                      href={buildAdminPageHref({
                        query,
                        status: statusFilter,
                        staff: staffFilter,
                        page: appointments.page + 1,
                        day: selectedDay,
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
                    <h2 className="font-serif text-2xl font-bold text-foreground">Gunluk Takvim Gorunumu</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Saat satirlari ve personel sutunlariyla gunluk randevu yogunlugu.
                    </p>
                  </div>
                  <form className="flex items-center gap-3">
                    <input type="hidden" name="q" value={query} />
                    <input type="hidden" name="status" value={statusFilter} />
                    <input type="hidden" name="staff" value={staffFilter} />
                    <input
                      type="date"
                      name="day"
                      defaultValue={selectedDay}
                      className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                    />
                    <button
                      type="submit"
                      className="rounded-xl border border-input bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-accent"
                    >
                      Gunu Goster
                    </button>
                  </form>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <div className="min-w-[780px] rounded-2xl border border-border">
                    <div className="grid grid-cols-[120px_repeat(auto-fit,minmax(160px,1fr))] border-b border-border bg-secondary/40" style={{ gridTemplateColumns: `120px repeat(${Math.max(calendarView.staff.length, 1)}, minmax(160px, 1fr))` }}>
                      <div className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Saat</div>
                      {calendarView.staff.map((person) => (
                        <div key={person.id} className="border-l border-border px-4 py-3 text-sm font-medium text-foreground">
                          {person.name}
                        </div>
                      ))}
                    </div>
                    {calendarTimes.length ? (
                      calendarTimes.map((time) => (
                        <div key={time} className="grid border-b border-border last:border-b-0" style={{ gridTemplateColumns: `120px repeat(${Math.max(calendarView.staff.length, 1)}, minmax(160px, 1fr))` }}>
                          <div className="px-4 py-4 text-sm font-medium text-foreground">{time}</div>
                          {calendarView.staff.map((person) => {
                            const appointment = calendarView.appointments.find(
                              (entry) => entry.scheduledTime === time && entry.staffId === person.id
                            )

                            return (
                              <div key={`${time}-${person.id}`} className="border-l border-border px-3 py-3">
                                {appointment ? (
                                  <div className={`rounded-xl px-3 py-3 text-sm ${getCalendarToneClass(appointment.status)}`}>
                                    <div className="font-medium">{appointment.customer.name}</div>
                                    <div className="mt-1 text-xs opacity-80">{appointment.service.title}</div>
                                  </div>
                                ) : (
                                  <div className="rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                                    Bos
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-sm text-muted-foreground">Secilen gun icin takvim kaydi bulunmuyor.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-2xl font-bold text-foreground">Personel Prim Ozeti</h2>
                <div className="mt-4 space-y-3">
                  {staffCommissionSummary.map((person) => (
                    <div key={person.id} className="rounded-xl bg-secondary px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium text-foreground">{person.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {person.role} / %{person.commissionRate} prim
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{person.totalAppointments} odemeli islem</div>
                          <div>{formatCurrency(person.totalRevenue)} ciro</div>
                          <div className="font-medium text-foreground">{formatCurrency(person.estimatedCommission)} prim</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-2xl font-bold text-foreground">Musteri Gecmisi</h2>
                <div className="mt-4 space-y-3">
                  {customerInsights.map((customer) => (
                    <div key={customer.id} className="rounded-xl bg-secondary px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium text-foreground">{customer.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{customer.phone ?? "Telefon yok"}</div>
                          <div className="text-sm text-muted-foreground">{customer.email ?? "E-posta yok"}</div>
                        </div>
                        <Link
                          className="rounded-full border border-input bg-background px-3 py-2 text-xs uppercase tracking-[0.16em] text-foreground transition-colors hover:border-accent"
                          href={`/admin/customers/${customer.id}`}
                        >
                          Detay
                        </Link>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                        <p>Aktif plan: {customer.activeAppointments}</p>
                        <p>Tamamlanan hizmet: {customer.completedAppointments}</p>
                        <p>Toplam harcama: {formatCurrency(customer.totalSpending)}</p>
                        <p>Sadakat puani: {customer.loyaltyPoints}</p>
                        <p>Indirim hakki: {customer.availableDiscounts}</p>
                        <p>
                          Son kayit:{" "}
                          {customer.latestAppointment
                            ? `${customer.latestAppointment.serviceTitle} / ${customer.latestAppointment.scheduledDate} / ${customer.latestAppointment.scheduledTime}`
                            : "Henuz yok"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-2xl font-bold text-foreground">Paket Hizmetler</h2>
                <div className="mt-4 space-y-3">
                  {activePackages.map((pkg) => (
                    <div key={pkg.id} className="rounded-xl bg-secondary px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium text-foreground">{pkg.name}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{pkg.teaser}</div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{formatCurrency(pkg.packagePrice)}</div>
                          <div>{pkg.totalDurationMinutes} dk</div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {pkg.packageServices.map((item) => (
                          <span
                            key={item.id}
                            className="rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground"
                          >
                            {item.service.shortTitle}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-2xl font-bold text-foreground">Isletme Ayarlari</h2>
                <div className="mt-4">
                  <BusinessSettingsForm
                    settings={{
                      businessName: settings?.businessName ?? "Adakan Hair Studio",
                      tagline: settings?.tagline ?? "Premium kuafor operasyon sistemi",
                      phone: settings?.phone ?? "",
                      whatsappPhone: settings?.whatsappPhone ?? settings?.phone ?? "",
                      email: settings?.email ?? "",
                      address: settings?.address ?? "",
                      city: settings?.city ?? "",
                      currency: settings?.currency ?? "TRY",
                      dailyCapacity: settings?.dailyCapacity ?? 22,
                      workingHoursNote,
                    }}
                  />
                </div>
              </div>

              <PanelCard
                title="Takip Sirasi"
                items={followUpQueue.length ? followUpQueue.map((item) => `${item.title}: ${item.description}`) : ["Acil takip gerektiren kayit gorunmuyor."]}
              />

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-foreground">Yaklasan Ajanda</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Sonraki aktif randevular hizli gorunum.</p>
                  </div>
                  <span className="rounded-full bg-secondary px-4 py-2 text-sm text-foreground">
                    {upcomingAgenda.length} plan
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {upcomingAgenda.map((appointment) => (
                    <div key={appointment.id} className="rounded-xl bg-secondary px-4 py-4">
                      <div className="font-medium text-foreground">{appointment.customer.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {appointment.service.title} / {appointment.scheduledDate} / {appointment.scheduledTime}
                      </div>
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

function normalizeStatusFilter(value?: string) {
  if (value === "NEW" || value === "CONFIRMED" || value === "COMPLETED" || value === "CANCELLED") {
    return value
  }

  return "ALL"
}

function normalizePageParam(value?: string) {
  const page = Number(value)
  return Number.isFinite(page) ? Math.max(Math.floor(page), 1) : 1
}

function normalizeDateParam(value?: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") ? (value as string) : new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date())
}

function buildAdminPageHref(input: {
  query: string
  status: "ALL" | AppointmentStatus
  staff: string
  page: number
  day: string
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

  if (input.day) {
    params.set("day", input.day)
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

function getCalendarToneClass(status: AppointmentStatus) {
  if (status === "CONFIRMED") {
    return "bg-emerald-500/10 text-emerald-800"
  }

  if (status === "COMPLETED") {
    return "bg-sky-500/10 text-sky-800"
  }

  if (status === "CANCELLED") {
    return "bg-rose-500/10 text-rose-800"
  }

  return "bg-amber-500/10 text-amber-800"
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-serif text-4xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function HighlightCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">{label}</p>
      <p className="mt-2 font-serif text-3xl font-bold text-primary-foreground">{value}</p>
      <p className="mt-1 text-sm text-primary-foreground/70">{caption}</p>
    </div>
  )
}

function InsightCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <p className="mt-3 font-serif text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
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

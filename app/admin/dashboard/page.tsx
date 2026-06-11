import Link from "next/link"
import { getAppointmentMetrics, getBusinessSettings, getOperationalAlerts } from "@/lib/bookings-repository"
import { getEndOfDaySummary, getTenantSubscriptionDetails } from "@/lib/salon-ops-repository"

export default async function AdminDashboardPage() {
  const [settings, metrics, alerts, daySummary, subscription] = await Promise.all([
    getBusinessSettings(),
    getAppointmentMetrics(),
    getOperationalAlerts(),
    getEndOfDaySummary(),
    getTenantSubscriptionDetails(),
  ])

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-6 lg:px-8">
        <div className="rounded-3xl bg-primary px-8 py-10 text-primary-foreground">
          <p className="text-sm uppercase tracking-[0.18em] text-primary-foreground/70">Dashboard</p>
          <h2 className="mt-3 font-serif text-4xl font-bold">{settings?.businessName ?? "Salon"}</h2>
          <p className="mt-3 max-w-3xl text-sm text-primary-foreground/80">
            Multi-tenant salon operasyon, odeme, prim, sadakat, abonelik ve raporlama omurgasi.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Toplam Randevu" value={String(metrics.totalAppointments)} />
          <MetricCard label="Bugunku Randevu" value={String(metrics.todaysAppointments)} />
          <MetricCard label="Gunluk Ciro" value={formatCurrency(daySummary.revenueTotal)} />
          <MetricCard label="Bekleyen Odeme" value={`${daySummary.pendingPaymentCount}`} />
          <MetricCard label="Plan" value={subscription.subscription.plan} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <PanelCard
            title="Gun Sonu Ozeti"
            lines={[
              `Nakit: ${formatCurrency(daySummary.cashTotal)}`,
              `Kart: ${formatCurrency(daySummary.cardTotal)}`,
              `IBAN: ${formatCurrency(daySummary.ibanTotal)}`,
              `Iptal orani: %${daySummary.cancelRate}`,
              `En iyi hizmet: ${daySummary.topService?.title ?? "Veri bekleniyor"}`,
            ]}
          />
          <PanelCard
            title="Operasyon Uyarilari"
            lines={[
              `Atama bekleyen: ${alerts.unassignedActiveAppointments}`,
              `Bekleyen yeni talep: ${metrics.newAppointments}`,
              `Stale talep: ${alerts.staleRequests}`,
              `Bugunku kapasite: ${alerts.todayCapacity}`,
              `Aktif ekip: ${alerts.activeStaffCount}`,
            ]}
          />
          <PanelCard
            title="Abonelik ve Limit"
            lines={[
              `Plan: ${subscription.subscription.plan}`,
              `Personel kullanim: ${subscription.usage.staffCount}`,
              `Aylik randevu kullanim: ${subscription.usage.currentMonthAppointments}`,
              `Raporlar: ${subscription.limits.reportsEnabled ? "Acik" : "Kapali"}`,
              `Stok: ${subscription.limits.inventoryEnabled ? "Acik" : "Kapali"}`,
            ]}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            ["/admin/appointments", "Randevular"],
            ["/admin/payments", "Odemeler"],
            ["/admin/reports", "Raporlar"],
            ["/admin/inventory", "Stok ve Satis"],
            ["/setup", "Kurulum Sihirbazi"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="rounded-full border border-input bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
              {label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-serif text-3xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function PanelCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-serif text-2xl font-bold text-foreground">{title}</h3>
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value)
}

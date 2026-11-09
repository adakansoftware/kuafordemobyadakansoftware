import Link from "next/link"
import { getAppointmentMetrics, getBusinessSettings, getOperationalAlerts } from "@/lib/bookings-repository"
import { getEndOfDaySummary, getTenantSubscriptionDetails } from "@/lib/salon-ops-repository"
import { getAdminLocale, getAdminMessages } from "@/lib/i18n/admin"

export default async function AdminDashboardPage() {
  const [settings, metrics, alerts, daySummary, subscription, locale] = await Promise.all([
    getBusinessSettings(),
    getAppointmentMetrics(),
    getOperationalAlerts(),
    getEndOfDaySummary(),
    getTenantSubscriptionDetails(),
    getAdminLocale(),
  ])
  const t = getAdminMessages(locale).dashboard

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-6 lg:px-8">
        <div className="rounded-3xl bg-primary px-8 py-10 text-primary-foreground">
          <p className="text-sm uppercase tracking-[0.18em] text-primary-foreground/70">{t.title}</p>
          <h2 className="mt-3 font-serif text-4xl font-bold">{settings?.businessName ?? "Salon"}</h2>
          <p className="mt-3 max-w-3xl text-sm text-primary-foreground/80">{t.intro}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label={t.totalAppointments} value={String(metrics.totalAppointments)} />
          <MetricCard label={t.todaysAppointments} value={String(metrics.todaysAppointments)} />
          <MetricCard label={t.dailyRevenue} value={formatCurrency(daySummary.revenueTotal)} />
          <MetricCard label={t.pendingPayment} value={`${daySummary.pendingPaymentCount}`} />
          <MetricCard label={t.plan} value={subscription.subscription.plan} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <PanelCard
            title={t.endOfDayTitle}
            lines={[
              `${t.cash}: ${formatCurrency(daySummary.cashTotal)}`,
              `${t.card}: ${formatCurrency(daySummary.cardTotal)}`,
              `${t.iban}: ${formatCurrency(daySummary.ibanTotal)}`,
              `${t.cancelRate}: %${daySummary.cancelRate}`,
              `${t.topService}: ${daySummary.topService?.title ?? t.awaitingData}`,
            ]}
          />
          <PanelCard
            title={t.alertsTitle}
            lines={[
              `${t.unassigned}: ${alerts.unassignedActiveAppointments}`,
              `${t.newRequests}: ${metrics.newAppointments}`,
              `${t.staleRequests}: ${alerts.staleRequests}`,
              `${t.todayCapacity}: ${alerts.todayCapacity}`,
              `${t.activeStaff}: ${alerts.activeStaffCount}`,
            ]}
          />
          <PanelCard
            title={t.subscriptionTitle}
            lines={[
              `${t.plan}: ${subscription.subscription.plan}`,
              `${t.staffUsage}: ${subscription.usage.staffCount}`,
              `${t.monthlyUsage}: ${subscription.usage.currentMonthAppointments}`,
              `${t.reports}: ${subscription.limits.reportsEnabled ? t.open : t.closed}`,
              `${t.inventory}: ${subscription.limits.inventoryEnabled ? t.open : t.closed}`,
            ]}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            ["/admin/appointments", t.linkAppointments],
            ["/admin/payments", t.linkPayments],
            ["/admin/reports", t.linkReports],
            ["/admin/inventory", t.linkInventory],
            ["/setup", t.linkSetup],
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

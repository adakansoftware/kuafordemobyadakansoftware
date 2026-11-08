import Link from "next/link"
import { AdminUserRole } from "@prisma/client"
import { getTodayInIstanbulDate, resolveSafeReportDateRange } from "@/lib/reporting"
import { getDateRangeReport } from "@/lib/salon-ops-repository"
import { requireAdminRoles } from "@/lib/security"

type ReportsPageProps = {
  searchParams?: Promise<{
    from?: string
    to?: string
  }>
}

export default async function AdminReportsPage({ searchParams }: ReportsPageProps) {
  await requireAdminRoles([AdminUserRole.OWNER, AdminUserRole.MANAGER])
  const params = (await searchParams) ?? {}
  const today = getTodayInIstanbulDate()
  const range = resolveSafeReportDateRange({
    from: params.from,
    to: params.to,
    fallbackDate: today,
  })
  const report = await getDateRangeReport(range)

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-3xl font-bold text-foreground">Raporlar</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <input type="date" name="from" defaultValue={range.from} className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <input type="date" name="to" defaultValue={range.to} className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            <button type="submit" className="rounded-xl bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground">Filtrele</button>
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/reports/export?from=${range.from}&to=${range.to}`} className="rounded-xl border border-input px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                CSV Export
              </Link>
              <Link href={`/admin/reports/print?from=${range.from}&to=${range.to}`} className="rounded-xl border border-input px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                Yazdir
              </Link>
            </div>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Ciro" value={formatCurrency(report.revenueTotal)} />
          <MetricCard label="Tamamlanan" value={String(report.completedAppointments)} />
          <MetricCard label="Iptal Orani" value={`%${report.cancelRate}`} />
          <MetricCard label="Tekrar Orani" value={`%${report.repeatCustomerRate}`} />
          <MetricCard label="Aylik" value={formatCurrency(report.monthlyRevenue)} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Personel Bazli Gelir" items={report.byStaff.map((item) => `${item.name}: ${formatCurrency(item.revenue)}`)} />
          <Panel title="Hizmet Bazli Gelir" items={report.byService.map((item) => `${item.title}: ${formatCurrency(item.revenue)}`)} />
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

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-serif text-2xl font-bold text-foreground">{title}</h3>
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value)
}

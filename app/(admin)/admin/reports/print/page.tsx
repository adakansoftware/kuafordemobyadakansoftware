import { AdminUserRole } from "@prisma/client"
import { getTodayInIstanbulDate, resolveSafeReportDateRange } from "@/lib/reporting"
import { getDateRangeReport } from "@/lib/salon-ops-repository"
import { getAdminLocale, getAdminMessages } from "@/lib/i18n/admin"
import { requireAdminRoles } from "@/lib/security"

type PrintPageProps = {
  searchParams?: Promise<{
    from?: string
    to?: string
  }>
}

export default async function PrintableReportsPage({ searchParams }: PrintPageProps) {
  await requireAdminRoles([AdminUserRole.OWNER, AdminUserRole.MANAGER])
  const params = (await searchParams) ?? {}
  const today = getTodayInIstanbulDate()
  const range = resolveSafeReportDateRange({
    from: params.from,
    to: params.to,
    fallbackDate: today,
  })
  const report = await getDateRangeReport(range)
  const locale = await getAdminLocale()
  const t = getAdminMessages(locale).printReport

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <h1 className="font-serif text-4xl font-bold text-foreground">{t.title}</h1>
      <p className="text-sm text-muted-foreground">
        {range.from} - {range.to}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <ReportItem label={t.totalRevenue} value={formatCurrency(report.revenueTotal)} />
        <ReportItem label={t.completedAppointments} value={String(report.completedAppointments)} />
        <ReportItem label={t.cancelRate} value={`%${report.cancelRate}`} />
        <ReportItem label={t.repeatRate} value={`%${report.repeatCustomerRate}`} />
      </div>
    </section>
  )
}

function ReportItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-serif text-3xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value)
}

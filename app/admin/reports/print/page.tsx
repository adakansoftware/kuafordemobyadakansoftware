import { AdminUserRole } from "@prisma/client"
import { getDateRangeReport } from "@/lib/salon-ops-repository"
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
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date())
  const from = params.from && /^\d{4}-\d{2}-\d{2}$/.test(params.from) ? params.from : today
  const to = params.to && /^\d{4}-\d{2}-\d{2}$/.test(params.to) ? params.to : today
  const report = await getDateRangeReport({ from, to })

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <h1 className="font-serif text-4xl font-bold text-foreground">Yazdirilabilir Gun Sonu ve Tarih Araligi Raporu</h1>
      <p className="text-sm text-muted-foreground">
        {from} - {to}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <ReportItem label="Toplam Ciro" value={formatCurrency(report.revenueTotal)} />
        <ReportItem label="Tamamlanan Randevu" value={String(report.completedAppointments)} />
        <ReportItem label="Iptal Orani" value={`%${report.cancelRate}`} />
        <ReportItem label="Tekrar Musteri Orani" value={`%${report.repeatCustomerRate}`} />
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

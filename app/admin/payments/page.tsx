import { AdminUserRole } from "@prisma/client"
import { getUnpaidCompletedAppointments, getEndOfDaySummary } from "@/lib/salon-ops-repository"
import { requireAdminRoles } from "@/lib/security"

export default async function AdminPaymentsPage() {
  const access = await requireAdminRoles([AdminUserRole.OWNER, AdminUserRole.MANAGER])
  const [unpaid, daySummary] = await Promise.all([
    getUnpaidCompletedAppointments(20, { accessContext: access }),
    getEndOfDaySummary(),
  ])

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-3xl font-bold text-foreground">Odemeler</h2>
          <p className="mt-2 text-sm text-muted-foreground">Tamamlanmis ama tahsil edilmemis randevular ve gunluk tahsilat ozeti.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Bugunku Ciro" value={formatCurrency(daySummary.revenueTotal)} />
          <MetricCard label="Nakit" value={formatCurrency(daySummary.cashTotal)} />
          <MetricCard label="Kart" value={formatCurrency(daySummary.cardTotal)} />
          <MetricCard label="Bekleyen Odeme" value={formatCurrency(daySummary.pendingPaymentAmount)} />
        </div>

        <div className="space-y-4">
          {unpaid.map((appointment) => (
            <div key={appointment.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-medium text-foreground">{appointment.customer.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {appointment.service.title} / {appointment.scheduledDate} / {appointment.scheduledTime}
                  </p>
                </div>
                <div className="text-sm font-medium text-amber-800">
                  Bekleyen tahsilat: {formatCurrency(appointment.service.priceFrom)}
                </div>
              </div>
            </div>
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value)
}

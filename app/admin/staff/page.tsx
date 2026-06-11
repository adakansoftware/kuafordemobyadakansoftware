import { AdminUserRole } from "@prisma/client"
import { StaffAvailabilityForm } from "@/components/admin/staff-availability-form"
import { StaffTimeOffForm } from "@/components/admin/staff-timeoff-form"
import { getStaffWorkload, listStaffFromDb } from "@/lib/bookings-repository"
import { getStaffCommissionSummary } from "@/lib/salon-ops-repository"
import { requireAdminRoles } from "@/lib/security"

export default async function AdminStaffPage() {
  await requireAdminRoles([AdminUserRole.OWNER, AdminUserRole.MANAGER])
  const [staff, workload, commissions] = await Promise.all([
    listStaffFromDb(),
    getStaffWorkload(),
    getStaffCommissionSummary(),
  ])

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-3xl font-bold text-foreground">Personel</h2>
          <p className="mt-2 text-sm text-muted-foreground">Prim, is yukü, musaitlik ve izin yonetimi.</p>
        </div>

        <div className="space-y-6">
          {staff.map((person) => {
            const workloadItem = workload.find((item) => item.id === person.id)
            const commissionItem = commissions.find((item) => item.id === person.id)

            return (
              <div key={person.id} className="rounded-2xl border border-border bg-card p-6">
                <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr_1fr]">
                  <div>
                    <h3 className="font-medium text-foreground">{person.name}</h3>
                    <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
                      <p>Rol: {person.role}</p>
                      <p>Aktif randevu: {workloadItem?.activeAppointments ?? 0}</p>
                      <p>Odemeli islem: {commissionItem?.totalAppointments ?? 0}</p>
                      <p>Tahmini prim: {formatCurrency(commissionItem?.estimatedCommission ?? 0)}</p>
                    </div>
                  </div>
                  <StaffAvailabilityForm staffId={person.id} />
                  <StaffTimeOffForm staffId={person.id} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value)
}

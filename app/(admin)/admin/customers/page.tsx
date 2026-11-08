import Link from "next/link"
import { AdminUserRole } from "@prisma/client"
import { getCustomerInsights } from "@/lib/bookings-repository"
import { requireAdminRoles } from "@/lib/security"

export default async function AdminCustomersPage() {
  await requireAdminRoles([AdminUserRole.OWNER, AdminUserRole.MANAGER])
  const customers = await getCustomerInsights()

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-3xl font-bold text-foreground">Musteriler</h2>
          <p className="mt-2 text-sm text-muted-foreground">Tekrar oranı, sadakat ve toplam harcama bazli musteri gorme alani.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {customers.map((customer) => (
            <div key={customer.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-foreground">{customer.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{customer.phone ?? "Telefon yok"}</p>
                  <p className="text-sm text-muted-foreground">{customer.email ?? "E-posta yok"}</p>
                </div>
                <Link href={`/admin/customers/${customer.id}`} className="rounded-full border border-input px-3 py-2 text-xs uppercase tracking-[0.16em] text-foreground">
                  Detay
                </Link>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <p>Aktif plan: {customer.activeAppointments}</p>
                <p>Tamamlanan hizmet: {customer.completedAppointments}</p>
                <p>Toplam harcama: {formatCurrency(customer.totalSpending)}</p>
                <p>Sadakat puani: {customer.loyaltyPoints}</p>
                <p>Indirim hakki: {customer.availableDiscounts}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value)
}

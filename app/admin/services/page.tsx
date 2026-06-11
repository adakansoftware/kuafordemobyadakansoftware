import { AdminUserRole } from "@prisma/client"
import { listServicesFromDb } from "@/lib/bookings-repository"
import { requireAdminRoles } from "@/lib/security"

export default async function AdminServicesPage() {
  await requireAdminRoles([AdminUserRole.OWNER, AdminUserRole.MANAGER])
  const services = await listServicesFromDb()

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-3xl font-bold text-foreground">Hizmetler</h2>
          <p className="mt-2 text-sm text-muted-foreground">Tenant bazli hizmet katalgu, fiyat ve sure bilgileri.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {services.map((service) => (
            <div key={service.id} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-medium text-foreground">{service.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{service.teaser}</p>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <p>Sure: {service.durationMinutes} dk</p>
                <p>Baslangic fiyat: {service.priceLabel}</p>
                <p>Durum: {service.isActive ? "Aktif" : "Pasif"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

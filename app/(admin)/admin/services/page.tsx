import { AdminUserRole } from "@prisma/client"
import { listServicesFromDb } from "@/lib/bookings-repository"
import { getAdminLocale, getAdminMessages } from "@/lib/i18n/admin"
import { requireAdminRoles } from "@/lib/security"

export default async function AdminServicesPage() {
  await requireAdminRoles([AdminUserRole.OWNER, AdminUserRole.MANAGER])
  const [services, locale] = await Promise.all([listServicesFromDb(), getAdminLocale()])
  const t = getAdminMessages(locale).services

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-3xl font-bold text-foreground">{t.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.intro}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {services.map((service) => (
            <div key={service.id} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-medium text-foreground">{service.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{service.teaser}</p>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <p>{t.duration}: {service.durationMinutes} dk</p>
                <p>{t.priceFrom}: {service.priceLabel}</p>
                <p>{t.status}: {service.isActive ? t.active : t.inactive}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

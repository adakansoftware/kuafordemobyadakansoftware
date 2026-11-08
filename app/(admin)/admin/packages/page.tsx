import { AdminUserRole } from "@prisma/client"
import { getActivePackages } from "@/lib/salon-ops-repository"
import { requireAdminRoles } from "@/lib/security"

export default async function AdminPackagesPage() {
  await requireAdminRoles([AdminUserRole.OWNER, AdminUserRole.MANAGER])
  const packages = await getActivePackages()

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-3xl font-bold text-foreground">Paketler</h2>
          <p className="mt-2 text-sm text-muted-foreground">Mevcut service yapisini bozmadan paket satis kurgusu.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {packages.map((pkg) => (
            <div key={pkg.id} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-foreground">{pkg.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{pkg.teaser}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <div>{formatCurrency(pkg.packagePrice)}</div>
                  <div>{pkg.totalDurationMinutes} dk</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {pkg.packageServices.map((item) => (
                  <span key={item.id} className="rounded-full border border-input px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {item.service.shortTitle}
                  </span>
                ))}
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

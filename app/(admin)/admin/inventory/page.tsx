import { AdminUserRole } from "@prisma/client"
import { ProductSaleForm } from "@/components/admin/product-sale-form"
import { getCustomerInsights, listStaffFromDb } from "@/lib/bookings-repository"
import { listInventoryProducts } from "@/lib/salon-ops-repository"
import { getAdminLocale, getAdminMessages } from "@/lib/i18n/admin"
import { requireAdminRoles } from "@/lib/security"

export default async function AdminInventoryPage() {
  await requireAdminRoles([AdminUserRole.OWNER, AdminUserRole.MANAGER])
  const [products, customers, staff, locale] = await Promise.all([
    listInventoryProducts(),
    getCustomerInsights(),
    listStaffFromDb(),
    getAdminLocale(),
  ])
  const t = getAdminMessages(locale).inventory

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-3xl font-bold text-foreground">{t.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.intro}</p>
        </div>

        <ProductSaleForm
          locale={locale}
          products={products.map((product) => ({ id: product.id, name: product.name, stock: product.stock }))}
          customers={customers.map((customer) => ({ id: customer.id, name: customer.name }))}
          staff={staff.map((person) => ({ id: person.id, name: person.name }))}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          {products.map((product) => (
            <div key={product.id} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-medium text-foreground">{product.name}</h3>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <p>{t.sku}: {product.sku}</p>
                <p>{t.stock}: {product.stock}</p>
                <p>{t.purchasePrice}: {formatCurrency(product.purchasePrice)}</p>
                <p>{t.salePrice}: {formatCurrency(product.salePrice)}</p>
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

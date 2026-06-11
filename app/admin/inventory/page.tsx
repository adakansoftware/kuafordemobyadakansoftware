import { AdminUserRole } from "@prisma/client"
import { ProductSaleForm } from "@/components/admin/product-sale-form"
import { getCustomerInsights, listStaffFromDb } from "@/lib/bookings-repository"
import { listInventoryProducts } from "@/lib/salon-ops-repository"
import { requireAdminRoles } from "@/lib/security"

export default async function AdminInventoryPage() {
  await requireAdminRoles([AdminUserRole.OWNER, AdminUserRole.MANAGER])
  const [products, customers, staff] = await Promise.all([
    listInventoryProducts(),
    getCustomerInsights(),
    listStaffFromDb(),
  ])

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-3xl font-bold text-foreground">Stok ve Urun Satisi</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sampuan, wax ve bakim urunu satislari icin tenant bazli stok yonetimi.</p>
        </div>

        <ProductSaleForm
          products={products.map((product) => ({ id: product.id, name: product.name, stock: product.stock }))}
          customers={customers.map((customer) => ({ id: customer.id, name: customer.name }))}
          staff={staff.map((person) => ({ id: person.id, name: person.name }))}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          {products.map((product) => (
            <div key={product.id} className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-medium text-foreground">{product.name}</h3>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <p>SKU: {product.sku}</p>
                <p>Stok: {product.stock}</p>
                <p>Alis: {formatCurrency(product.purchasePrice)}</p>
                <p>Satis: {formatCurrency(product.salePrice)}</p>
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

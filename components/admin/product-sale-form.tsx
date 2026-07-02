"use client"

import { PaymentMethod } from "@prisma/client"
import { useActionState } from "react"
import { type ProductSaleActionState, recordProductSaleAction } from "@/app/admin/actions"
import { getPaymentMethodOptions } from "@/lib/salon-ops"

const initialState: ProductSaleActionState = {
  success: false,
  message: "",
}

export function ProductSaleForm({
  products,
  customers,
  staff,
}: {
  products: Array<{ id: string; name: string; stock: number }>
  customers: Array<{ id: string; name: string }>
  staff: Array<{ id: string; name: string }>
}) {
  const [state, formAction] = useActionState(recordProductSaleAction, initialState)

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">Urun</span>
          <select name="productId" className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.stock} adet)
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">Adet</span>
          <input type="number" name="quantity" min={1} defaultValue={1} className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
        </label>

        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">Musteri</span>
          <select name="customerId" className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
            <option value="">Musteri secilmedi</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">Personel</span>
          <select name="staffId" className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
            <option value="">Personel secilmedi</option>
            {staff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">Odeme Yontemi</span>
          <select name="method" defaultValue={PaymentMethod.CARD} className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
            {getPaymentMethodOptions().map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">Not</span>
          <input type="text" name="note" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
        </label>

        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">Admin Sifresi</span>
          <input
            type="password"
            name="adminPassword"
            autoComplete="current-password"
            placeholder="Kritik stok/satis islemi icin gerekli olabilir"
            className="rounded-xl border border-input bg-background px-4 py-3 text-sm"
          />
        </label>

        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">Authenticator Kodu</span>
          <input
            name="adminTotpCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="MFA aktifse gerekli"
            className="rounded-xl border border-input bg-background px-4 py-3 text-sm"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className={state.success ? "text-sm text-green-600" : "text-sm text-muted-foreground"}>
          {state.message || "Stok dusumu otomatik islenir."}
        </p>
        <button type="submit" className="rounded-xl bg-primary px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground">
          Satis Kaydet
        </button>
      </div>
    </form>
  )
}

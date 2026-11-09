"use client"

import { PaymentMethod } from "@prisma/client"
import { useActionState } from "react"
import { type ProductSaleActionState, recordProductSaleAction } from "@/app/(admin)/admin/actions"
import { getAdminMessages } from "@/lib/i18n/admin-messages"
import type { Locale } from "@/lib/i18n/validation"
import { getPaymentMethodOptions } from "@/lib/salon-ops"

const initialState: ProductSaleActionState = {
  success: false,
  message: "",
}

export function ProductSaleForm({
  locale,
  products,
  customers,
  staff,
}: {
  locale: Locale
  products: Array<{ id: string; name: string; stock: number }>
  customers: Array<{ id: string; name: string }>
  staff: Array<{ id: string; name: string }>
}) {
  const [state, formAction] = useActionState(recordProductSaleAction, initialState)
  const t = getAdminMessages(locale).productSale

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">{t.product}</span>
          <select name="productId" className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.stock})
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">{t.quantity}</span>
          <input type="number" name="quantity" min={1} defaultValue={1} className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
        </label>

        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">{t.customer}</span>
          <select name="customerId" className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
            <option value="">{t.customerNotSelected}</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">{t.staff}</span>
          <select name="staffId" className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
            <option value="">{t.staffNotSelected}</option>
            {staff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">{t.method}</span>
          <select name="method" defaultValue={PaymentMethod.CARD} className="rounded-xl border border-input bg-background px-4 py-3 text-sm">
            {getPaymentMethodOptions(locale).map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">{t.note}</span>
          <input type="text" name="note" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
        </label>

        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">{t.adminPassword}</span>
          <input
            type="password"
            name="adminPassword"
            autoComplete="current-password"
            placeholder={t.adminPasswordPlaceholder}
            className="rounded-xl border border-input bg-background px-4 py-3 text-sm"
          />
        </label>

        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">{t.totpCode}</span>
          <input
            name="adminTotpCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={t.totpPlaceholder}
            className="rounded-xl border border-input bg-background px-4 py-3 text-sm"
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className={state.success ? "text-sm text-green-600" : "text-sm text-muted-foreground"}>
          {state.message || t.hint}
        </p>
        <button type="submit" className="rounded-xl bg-primary px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground">
          {t.submit}
        </button>
      </div>
    </form>
  )
}

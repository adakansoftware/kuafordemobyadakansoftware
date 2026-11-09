"use client"

import { useActionState } from "react"
import {
  type BusinessSettingsActionState,
  updateBusinessSettingsAction,
} from "@/app/(admin)/admin/actions"
import { getAdminMessages } from "@/lib/i18n/admin-messages"
import type { Locale } from "@/lib/i18n/validation"

const initialState: BusinessSettingsActionState = {
  success: false,
  message: "",
}

type BusinessSettingsFormProps = {
  locale: Locale
  settings: {
    businessName: string
    tagline: string
    phone: string
    whatsappPhone: string
    email: string
    address: string
    city: string
    currency: string
    dailyCapacity: number
    workingHoursNote: string
  }
}

export function BusinessSettingsForm({ locale, settings }: BusinessSettingsFormProps) {
  const [state, formAction] = useActionState(updateBusinessSettingsAction, initialState)
  const t = getAdminMessages(locale).businessSettings

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t.businessName} name="businessName" defaultValue={settings.businessName} />
        <Field label={t.tagline} name="tagline" defaultValue={settings.tagline} />
        <Field label={t.phone} name="phone" defaultValue={settings.phone} />
        <Field label={t.whatsapp} name="whatsappPhone" defaultValue={settings.whatsappPhone} />
        <Field label={t.email} name="email" defaultValue={settings.email} type="email" />
        <Field label={t.city} name="city" defaultValue={settings.city} />
        <Field label={t.currency} name="currency" defaultValue={settings.currency} />
        <Field
          label={t.dailyCapacity}
          name="dailyCapacity"
          defaultValue={String(settings.dailyCapacity)}
          type="number"
        />
      </div>

      <Field label={t.address} name="address" defaultValue={settings.address} />

      <label className="grid gap-2 text-sm text-foreground">
        <span className="font-medium">{t.workingHoursNote}</span>
        <textarea
          name="workingHoursNote"
          defaultValue={settings.workingHoursNote}
          rows={4}
          className="resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </label>

      <label className="grid gap-2 text-sm text-foreground">
        <span className="font-medium">{t.adminPassword}</span>
        <input
          type="password"
          name="adminPassword"
          autoComplete="current-password"
          placeholder={t.adminPasswordPlaceholder}
          className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </label>

      <label className="grid gap-2 text-sm text-foreground">
        <span className="font-medium">{t.totpCode}</span>
        <input
          name="adminTotpCode"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder={t.totpPlaceholder}
          className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </label>

      <div className="flex items-center justify-between gap-4">
        <p className={state.success ? "text-sm text-green-600" : "text-sm text-muted-foreground"}>
          {state.message || t.hint}
        </p>
        <button
          type="submit"
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t.submit}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string
  name: string
  defaultValue: string
  type?: "text" | "email" | "number"
}) {
  return (
    <label className="grid gap-2 text-sm text-foreground">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
      />
    </label>
  )
}

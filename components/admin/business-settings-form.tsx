"use client"

import { useActionState } from "react"
import {
  type BusinessSettingsActionState,
  updateBusinessSettingsAction,
} from "@/app/admin/actions"

const initialState: BusinessSettingsActionState = {
  success: false,
  message: "",
}

type BusinessSettingsFormProps = {
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

export function BusinessSettingsForm({ settings }: BusinessSettingsFormProps) {
  const [state, formAction] = useActionState(updateBusinessSettingsAction, initialState)

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Salon Adi" name="businessName" defaultValue={settings.businessName} />
        <Field label="Kisa Aciklama" name="tagline" defaultValue={settings.tagline} />
        <Field label="Telefon" name="phone" defaultValue={settings.phone} />
        <Field label="WhatsApp" name="whatsappPhone" defaultValue={settings.whatsappPhone} />
        <Field label="E-posta" name="email" defaultValue={settings.email} type="email" />
        <Field label="Sehir" name="city" defaultValue={settings.city} />
        <Field label="Para Birimi" name="currency" defaultValue={settings.currency} />
        <Field
          label="Gunluk Kapasite"
          name="dailyCapacity"
          defaultValue={String(settings.dailyCapacity)}
          type="number"
        />
      </div>

      <Field label="Adres" name="address" defaultValue={settings.address} />

      <label className="grid gap-2 text-sm text-foreground">
        <span className="font-medium">Calisma Saatleri Notu</span>
        <textarea
          name="workingHoursNote"
          defaultValue={settings.workingHoursNote}
          rows={4}
          className="resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </label>

      <div className="flex items-center justify-between gap-4">
        <p className={state.success ? "text-sm text-green-600" : "text-sm text-muted-foreground"}>
          {state.message || "Salon bilgileri, WhatsApp ve kapasite ayarlari buradan yonetilir."}
        </p>
        <button
          type="submit"
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-opacity hover:opacity-90"
        >
          Ayarlari Kaydet
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

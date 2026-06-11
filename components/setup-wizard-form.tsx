"use client"

import { useActionState } from "react"
import { completeSetupWizardAction, type SetupWizardState } from "@/app/setup/actions"

const initialState: SetupWizardState = {
  success: false,
  message: "",
}

export function SetupWizardForm() {
  const [state, formAction] = useActionState(completeSetupWizardAction, initialState)

  return (
    <form action={formAction} className="grid gap-4 rounded-3xl border border-border bg-card p-8 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Salon Adi" name="tenantName" />
        <Field label="Telefon" name="phone" />
        <Field label="Owner Kullanici Adi" name="ownerUsername" />
        <Field label="Owner E-posta" name="ownerEmail" type="email" />
        <Field label="Owner Sifre" name="ownerPassword" type="password" />
        <Field label="Personeller" name="staffNames" placeholder="Elif, Emre, Seda" />
      </div>
      <Field label="Hizmetler" name="serviceTitles" placeholder="Sac Kesim, Sac Boyama, Keratin" />
      <div className="flex items-center justify-between gap-4">
        <p className={state.success ? "text-sm text-green-600" : "text-sm text-muted-foreground"}>
          {state.message || "Demo veriden production tenant kurgusuna gecis sihirbazi."}
        </p>
        <button type="submit" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground">
          Kurulumu Tamamla
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
}: {
  label: string
  name: string
  placeholder?: string
  type?: string
}) {
  return (
    <label className="grid gap-2 text-sm text-foreground">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
      />
    </label>
  )
}

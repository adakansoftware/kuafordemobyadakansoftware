"use client"

import { useActionState } from "react"
import { adminLoginAction, type AdminLoginState } from "@/app/admin/login/actions"
import type { PublicFormChallenge } from "@/lib/request-security"

const initialState: AdminLoginState = {
  success: false,
  message: "",
}

export function AdminLoginForm({ securityChallenge }: { securityChallenge: PublicFormChallenge }) {
  const [state, formAction] = useActionState(adminLoginAction, initialState)

  return (
    <form action={formAction} className="grid gap-4 rounded-3xl border border-border bg-card p-8 shadow-sm">
      <input type="hidden" name="formIssuedAt" value={securityChallenge.formIssuedAt} />
      <input type="hidden" name="formSignature" value={securityChallenge.formSignature} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="grid gap-2 text-sm text-foreground">
        <span className="font-medium">Kullanici Adi</span>
        <input
          name="username"
          autoComplete="username"
          className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </label>

      <label className="grid gap-2 text-sm text-foreground">
        <span className="font-medium">Sifre</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </label>

      <p className={state.success ? "text-sm text-green-600" : "text-sm text-muted-foreground"}>
        {state.message || "Oturum cihaz ve ag baglamina baglanir; supheli oturumlar otomatik reddedilir."}
      </p>

      <button
        type="submit"
        className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground"
      >
        Giris Yap
      </button>
    </form>
  )
}

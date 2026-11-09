"use client"

import { useActionState } from "react"
import { adminLoginAction, type AdminLoginState } from "@/app/(admin)/admin/login/actions"
import { getAdminMessages } from "@/lib/i18n/admin-messages"
import type { Locale } from "@/lib/i18n/validation"
import type { PublicFormChallenge } from "@/lib/request-security"

const initialState: AdminLoginState = {
  success: false,
  message: "",
}

export function AdminLoginForm({
  securityChallenge,
  locale,
}: {
  securityChallenge: PublicFormChallenge
  locale: Locale
}) {
  const [state, formAction] = useActionState(adminLoginAction, initialState)
  const t = getAdminMessages(locale).login

  return (
    <form action={formAction} className="grid gap-4 rounded-3xl border border-border bg-card p-8 shadow-sm">
      <input type="hidden" name="formIssuedAt" value={securityChallenge.formIssuedAt} />
      <input type="hidden" name="formSignature" value={securityChallenge.formSignature} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="grid gap-2 text-sm text-foreground">
        <span className="font-medium">{t.username}</span>
        <input
          name="username"
          autoComplete="username"
          className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </label>

      <label className="grid gap-2 text-sm text-foreground">
        <span className="font-medium">{t.password}</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </label>

      <label className="grid gap-2 text-sm text-foreground">
        <span className="font-medium">{t.totpCode}</span>
        <input
          name="totpCode"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder={t.totpPlaceholder}
          className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </label>

      <p className={state.success ? "text-sm text-green-600" : "text-sm text-muted-foreground"}>
        {state.message || t.hint}
      </p>

      <button
        type="submit"
        className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground"
      >
        {t.submit}
      </button>
    </form>
  )
}

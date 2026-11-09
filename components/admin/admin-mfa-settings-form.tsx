"use client"

import { useActionState } from "react"
import {
  type AdminMfaActionState,
  type AdminSessionControlActionState,
  configureAdminMfaAction,
  revokeAdminSessionsAction,
} from "@/app/(admin)/admin/actions"
import { getAdminMessages } from "@/lib/i18n/admin-messages"
import type { Locale } from "@/lib/i18n/validation"

const initialState: AdminMfaActionState = {
  success: false,
  message: "",
}

const initialSessionState: AdminSessionControlActionState = {
  success: false,
  message: "",
}

type AdminMfaSettingsFormProps = {
  locale: Locale
  profile: {
    username: string
    mfaEnabled: boolean
    enabledAtLabel: string | null
  }
  enrollment: {
    enrollmentToken: string
    displaySecret: string
    otpauthUri: string
  }
}

export function AdminMfaSettingsForm({ locale, profile, enrollment }: AdminMfaSettingsFormProps) {
  const [state, formAction] = useActionState(configureAdminMfaAction, initialState)
  const [sessionState, revokeSessionsAction] = useActionState(revokeAdminSessionsAction, initialSessionState)
  const t = getAdminMessages(locale).mfa

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-serif text-2xl font-bold text-foreground">{t.title}</h3>
      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
        <p>{t.status}: {profile.mfaEnabled ? t.statusActive : t.statusInactive}</p>
        <p>{t.user}: {profile.username}</p>
        {profile.enabledAtLabel ? <p>{t.enabledAt}: {profile.enabledAtLabel}</p> : null}
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-2">
        <form action={formAction} className="grid gap-3 rounded-2xl border border-border/80 bg-secondary/20 p-4">
          <input type="hidden" name="intent" value="enable" />
          <input type="hidden" name="enrollmentToken" value={enrollment.enrollmentToken} />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{t.setupTitle}</p>
            <p>{t.setupIntro}</p>
          </div>

          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">{t.secretLabel}</span>
            <input
              value={enrollment.displaySecret}
              readOnly
              className="rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">{t.otpauthLabel}</span>
            <textarea
              value={enrollment.otpauthUri}
              readOnly
              rows={3}
              className="resize-none rounded-xl border border-input bg-background px-4 py-3 text-xs outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">{t.passwordLabel}</span>
            <input
              type="password"
              name="adminPassword"
              autoComplete="current-password"
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">{t.totpLabel}</span>
            <input
              name="totpCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t.totpPlaceholder}
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none"
            />
          </label>

          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground"
          >
            {t.enableButton}
          </button>
        </form>

        <form action={formAction} className="grid gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <input type="hidden" name="intent" value="disable" />
          <div className="space-y-2 text-sm text-rose-900">
            <p className="font-medium">{t.disableTitle}</p>
            <p>{t.disableIntro}</p>
          </div>

          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">{t.passwordLabel}</span>
            <input
              type="password"
              name="adminPassword"
              autoComplete="current-password"
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">{t.totpLabel}</span>
            <input
              name="totpCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t.totpPlaceholder}
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={!profile.mfaEnabled}
            className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t.disableButton}
          </button>
        </form>
      </div>

      <form action={revokeSessionsAction} className="mt-6 grid gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="space-y-2 text-sm text-amber-950">
          <p className="font-medium">{t.revokeTitle}</p>
          <p>{t.revokeIntro}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">{t.passwordLabel}</span>
            <input
              type="password"
              name="adminPassword"
              autoComplete="current-password"
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">
              {profile.mfaEnabled ? t.revokeTotpLabel : t.revokeTotpOptionalLabel}
            </span>
            <input
              name="totpCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={t.totpPlaceholder}
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none"
            />
          </label>
        </div>

        <button
          type="submit"
          className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white"
        >
          {t.revokeButton}
        </button>
      </form>

      <p className={state.success ? "mt-4 text-sm text-green-600" : "mt-4 text-sm text-muted-foreground"}>
        {state.message || t.hint}
      </p>
      <p className={sessionState.success ? "mt-2 text-sm text-green-600" : "mt-2 text-sm text-muted-foreground"}>
        {sessionState.message || t.revokeHint}
      </p>
    </div>
  )
}

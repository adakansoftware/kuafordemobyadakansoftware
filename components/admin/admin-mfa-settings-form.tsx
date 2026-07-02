"use client"

import { useActionState } from "react"
import { type AdminMfaActionState, configureAdminMfaAction } from "@/app/admin/actions"

const initialState: AdminMfaActionState = {
  success: false,
  message: "",
}

type AdminMfaSettingsFormProps = {
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

export function AdminMfaSettingsForm({ profile, enrollment }: AdminMfaSettingsFormProps) {
  const [state, formAction] = useActionState(configureAdminMfaAction, initialState)

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-serif text-2xl font-bold text-foreground">Admin MFA</h3>
      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
        <p>Durum: {profile.mfaEnabled ? "Aktif" : "Kapali"}</p>
        <p>Kullanici: {profile.username}</p>
        {profile.enabledAtLabel ? <p>Aktif edilme: {profile.enabledAtLabel}</p> : null}
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-2">
        <form action={formAction} className="grid gap-3 rounded-2xl border border-border/80 bg-secondary/20 p-4">
          <input type="hidden" name="intent" value="enable" />
          <input type="hidden" name="enrollmentToken" value={enrollment.enrollmentToken} />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Authenticator ile kur</p>
            <p>Asagidaki gizli anahtari Google Authenticator, 1Password veya benzeri bir TOTP uygulamasina ekleyin.</p>
          </div>

          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">Gizli Anahtar</span>
            <input
              value={enrollment.displaySecret}
              readOnly
              className="rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">otpauth URI</span>
            <textarea
              value={enrollment.otpauthUri}
              readOnly
              rows={3}
              className="resize-none rounded-xl border border-input bg-background px-4 py-3 text-xs outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">Mevcut Admin Sifresi</span>
            <input
              type="password"
              name="adminPassword"
              autoComplete="current-password"
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">Authenticator Kodu</span>
            <input
              name="totpCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6 haneli kod"
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none"
            />
          </label>

          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground"
          >
            MFA Aktif Et
          </button>
        </form>

        <form action={formAction} className="grid gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <input type="hidden" name="intent" value="disable" />
          <div className="space-y-2 text-sm text-rose-900">
            <p className="font-medium">MFA kapat</p>
            <p>Bu islem yuksek risklidir. Dogru sifre ve gecerli authenticator kodu olmadan tamamlanamaz.</p>
          </div>

          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">Mevcut Admin Sifresi</span>
            <input
              type="password"
              name="adminPassword"
              autoComplete="current-password"
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">Authenticator Kodu</span>
            <input
              name="totpCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6 haneli kod"
              className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={!profile.mfaEnabled}
            className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            MFA Kapat
          </button>
        </form>
      </div>

      <p className={state.success ? "mt-4 text-sm text-green-600" : "mt-4 text-sm text-muted-foreground"}>
        {state.message || "Kritik admin islemleri aktif MFA varsa parola ve TOTP birlikte ister."}
      </p>
    </div>
  )
}

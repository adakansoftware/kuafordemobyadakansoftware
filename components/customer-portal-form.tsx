"use client"

import { useActionState } from "react"
import {
  requestCustomerPortalCodeAction,
  type CustomerPortalState,
  verifyCustomerPortalCodeAction,
} from "@/app/musteri/actions"
import type { PublicFormChallenge } from "@/lib/request-security"

const initialState: CustomerPortalState = {
  step: "request",
  success: false,
  message: "",
}

export function CustomerPortalForm({ securityChallenge }: { securityChallenge: PublicFormChallenge }) {
  const [requestState, requestAction] = useActionState(requestCustomerPortalCodeAction, initialState)
  const [verifyState, verifyAction] = useActionState(verifyCustomerPortalCodeAction, requestState)

  if (requestState.step === "verify") {
    return (
      <form action={verifyAction} className="grid gap-4 rounded-3xl border border-border bg-card p-8 shadow-sm">
        <input type="hidden" name="tokenId" value={requestState.tokenId ?? ""} />
        <input type="hidden" name="website" value="" />
        <label className="grid gap-2 text-sm text-foreground">
          <span className="font-medium">Demo OTP Kodu</span>
          <input name="code" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
        </label>
        {requestState.mockCode ? <p className="text-sm text-muted-foreground">Mock kod: {requestState.mockCode}</p> : null}
        <p className={verifyState.success ? "text-sm text-green-600" : "text-sm text-muted-foreground"}>
          {verifyState.message || "Dogrulama kodunu girin."}
        </p>
        <button type="submit" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground">
          Panele Gir
        </button>
      </form>
    )
  }

  return (
    <form action={requestAction} className="grid gap-4 rounded-3xl border border-border bg-card p-8 shadow-sm">
      <input type="hidden" name="formIssuedAt" value={securityChallenge.formIssuedAt} />
      <input type="hidden" name="formSignature" value={securityChallenge.formSignature} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="grid gap-2 text-sm text-foreground">
        <span className="font-medium">Telefon veya E-posta</span>
        <input name="identifier" className="rounded-xl border border-input bg-background px-4 py-3 text-sm" />
      </label>
      <p className={requestState.success ? "text-sm text-green-600" : "text-sm text-muted-foreground"}>
        {requestState.message || "Musteri paneli icin mock OTP olusturulur."}
      </p>
      <button type="submit" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground">
        Kodu Gonder
      </button>
    </form>
  )
}

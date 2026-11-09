"use client"

import { useActionState } from "react"
import { type CustomerNotesActionState, updateCustomerNotesAction } from "@/app/(admin)/admin/actions"
import { getAdminMessages } from "@/lib/i18n/admin-messages"
import type { Locale } from "@/lib/i18n/validation"

const initialState: CustomerNotesActionState = {
  success: false,
  message: "",
}

export function CustomerNotesForm({
  customerId,
  notes,
  locale,
}: {
  customerId: string
  notes: string | null
  locale: Locale
}) {
  const [state, formAction] = useActionState(updateCustomerNotesAction, initialState)
  const t = getAdminMessages(locale).customerNotes

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="customerId" value={customerId} />
      <textarea
        name="notes"
        defaultValue={notes ?? ""}
        rows={5}
        placeholder={t.placeholder}
        className="resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
      />
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

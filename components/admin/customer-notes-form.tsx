"use client"

import { useActionState } from "react"
import { type CustomerNotesActionState, updateCustomerNotesAction } from "@/app/admin/actions"

const initialState: CustomerNotesActionState = {
  success: false,
  message: "",
}

export function CustomerNotesForm({
  customerId,
  notes,
}: {
  customerId: string
  notes: string | null
}) {
  const [state, formAction] = useActionState(updateCustomerNotesAction, initialState)

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="customerId" value={customerId} />
      <textarea
        name="notes"
        defaultValue={notes ?? ""}
        rows={5}
        placeholder="Musteri tercihleri, operasyon notlari veya sadakat detaylari"
        className="resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
      />
      <div className="flex items-center justify-between gap-4">
        <p className={state.success ? "text-sm text-green-600" : "text-sm text-muted-foreground"}>
          {state.message || "Musteri karti icin kalici admin notlari."}
        </p>
        <button
          type="submit"
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-opacity hover:opacity-90"
        >
          Notu Kaydet
        </button>
      </div>
    </form>
  )
}

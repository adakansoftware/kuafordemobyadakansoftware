"use client"

import { useActionState } from "react"
import { type StaffAvailabilityActionState, updateStaffAvailabilityAction } from "@/app/admin/actions"

const initialState: StaffAvailabilityActionState = {
  success: false,
  message: "",
}

export function StaffAvailabilityForm({
  staffId,
}: {
  staffId: string
}) {
  const [state, formAction] = useActionState(updateStaffAvailabilityAction, initialState)

  return (
    <form action={formAction} className="grid gap-3 rounded-2xl border border-border/80 bg-secondary/20 p-4">
      <input type="hidden" name="staffId" value={staffId} />
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Gun" name="dayOfWeek" type="number" defaultValue="1" />
        <Field label="Baslangic" name="startTime" defaultValue="10:00" />
        <Field label="Bitis" name="endTime" defaultValue="19:00" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Mola Baslangic" name="breakStartTime" defaultValue="13:00" />
        <Field label="Mola Bitis" name="breakEndTime" defaultValue="14:00" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <p className={state.success ? "text-sm text-green-600" : "text-sm text-muted-foreground"}>
          {state.message || "Haftalik vardiya ve mola araligi."}
        </p>
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground"
        >
          Musaitlik Kaydet
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
  type?: string
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

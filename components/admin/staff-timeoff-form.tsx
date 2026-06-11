"use client"

import { useActionState } from "react"
import { type StaffTimeOffActionState, createStaffTimeOffAction } from "@/app/admin/actions"

const initialState: StaffTimeOffActionState = {
  success: false,
  message: "",
}

export function StaffTimeOffForm({
  staffId,
}: {
  staffId: string
}) {
  const [state, formAction] = useActionState(createStaffTimeOffAction, initialState)

  return (
    <form action={formAction} className="grid gap-3 rounded-2xl border border-border/80 bg-secondary/20 p-4">
      <input type="hidden" name="staffId" value={staffId} />
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Baslangic Tarihi" name="startDate" type="date" />
        <Field label="Bitis Tarihi" name="endDate" type="date" />
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" name="isAllDay" value="true" defaultChecked />
        <span>Tum gun izin</span>
      </label>
      <Field label="Izin Nedeni" name="reason" />
      <div className="flex items-center justify-between gap-4">
        <p className={state.success ? "text-sm text-green-600" : "text-sm text-muted-foreground"}>
          {state.message || "Yillik izin, rapor veya vardiya disi blok."}
        </p>
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground"
        >
          Izin Ekle
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  type = "text",
}: {
  label: string
  name: string
  type?: string
}) {
  return (
    <label className="grid gap-2 text-sm text-foreground">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        name={name}
        className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
      />
    </label>
  )
}

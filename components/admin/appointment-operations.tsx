"use client"

import { useActionState, useMemo } from "react"
import { type AppointmentStatus } from "@prisma/client"
import { useFormStatus } from "react-dom"
import {
  type UpdateAppointmentActionState,
  updateAppointmentAction,
} from "@/app/admin/actions"

type StaffOption = {
  id: string
  name: string
  role: string
}

type AppointmentOperationCardProps = {
  appointment: {
    id: string
    status: AppointmentStatus
    scheduledDate: string
    scheduledTime: string
    notes: string | null
    customer: {
      name: string
      phone: string | null
      email: string | null
    }
    service: {
      title: string
    }
    staff: {
      id: string
      name: string
    } | null
  }
  staffOptions: StaffOption[]
}

const initialState: UpdateAppointmentActionState = {
  success: false,
  message: "",
}

const statusOptions: AppointmentStatus[] = ["NEW", "CONFIRMED", "COMPLETED", "CANCELLED"]

export function AppointmentOperations({
  appointment,
  staffOptions,
}: AppointmentOperationCardProps) {
  const [state, formAction] = useActionState(updateAppointmentAction, initialState)
  const currentState = state.appointmentId === appointment.id ? state : initialState

  const assignedStaffLabel = useMemo(() => {
    if (!appointment.staff) {
      return "Henuz atanmadi"
    }

    const matched = staffOptions.find((staff) => staff.id === appointment.staff?.id)
    return matched ? `${matched.name} - ${matched.role}` : appointment.staff.name
  }, [appointment.staff, staffOptions])

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-serif text-xl font-bold text-foreground">{appointment.customer.name}</h3>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
              {appointment.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {appointment.service.title} / {appointment.scheduledDate} / {appointment.scheduledTime}
          </p>
          <div className="grid gap-1 text-sm text-muted-foreground">
            <p>Telefon: {appointment.customer.phone ?? "Yok"}</p>
            <p>E-posta: {appointment.customer.email ?? "Yok"}</p>
            <p>Personel: {assignedStaffLabel}</p>
          </div>
        </div>

        <form action={formAction} className="grid w-full gap-3 xl:max-w-xl">
          <input type="hidden" name="appointmentId" value={appointment.id} />

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-foreground">
              <span className="font-medium">Durum</span>
              <select
                name="status"
                defaultValue={appointment.status}
                className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-foreground">
              <span className="font-medium">Personel</span>
              <select
                name="staffId"
                defaultValue={appointment.staff?.id ?? ""}
                className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              >
                <option value="">Atama yapilmadi</option>
                {staffOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} - {staff.role}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-sm text-foreground">
            <span className="font-medium">Operasyon Notu</span>
            <textarea
              name="notes"
              defaultValue={appointment.notes ?? ""}
              rows={3}
              placeholder="Onay notu, musteri talebi veya operasyon bilgisi ekleyin."
              className="resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </label>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className={currentState.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
              {currentState.message || "Durum, personel ve notlar ayni cekirdek kayit uzerinden yonetilir."}
            </p>
            <SubmitButton />
          </div>
        </form>
      </div>
    </article>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "Kaydediliyor..." : "Kaydi Guncelle"}
    </button>
  )
}

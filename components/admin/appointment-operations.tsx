"use client"

import { useActionState, useMemo } from "react"
import { type AppointmentStatus } from "@prisma/client"
import { useFormStatus } from "react-dom"
import { type UpdateAppointmentActionState, updateAppointmentAction } from "@/app/admin/actions"
import { siteContent } from "@/lib/site-content"

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

export function AppointmentOperations({ appointment, staffOptions }: AppointmentOperationCardProps) {
  const [state, formAction] = useActionState(updateAppointmentAction, initialState)
  const currentState = state.appointmentId === appointment.id ? state : initialState

  const assignedStaffLabel = useMemo(() => {
    if (!appointment.staff) {
      return "Henüz atanmadı"
    }

    const matched = staffOptions.find((staff) => staff.id === appointment.staff?.id)
    return matched ? `${matched.name} - ${matched.role}` : appointment.staff.name
  }, [appointment.staff, staffOptions])

  const statusToneClass = useMemo(() => {
    switch (appointment.status) {
      case "CONFIRMED":
        return "bg-emerald-500/10 text-emerald-700"
      case "COMPLETED":
        return "bg-sky-500/10 text-sky-700"
      case "CANCELLED":
        return "bg-rose-500/10 text-rose-700"
      default:
        return "bg-amber-500/10 text-amber-700"
    }
  }, [appointment.status])

  return (
    <article className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-serif text-xl font-bold text-foreground">{appointment.customer.name}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusToneClass}`}>
              {siteContent.admin.statusLabels[appointment.status]}
            </span>
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
              {appointment.staff ? "Planlandı" : "Atama bekliyor"}
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
                    {siteContent.admin.statusLabels[status]}
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
                <option value="">Atama yapılmadı</option>
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
              placeholder="Onay notu, müşteri talebi veya operasyon bilgisi ekleyin."
              maxLength={500}
              className="resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </label>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className={currentState.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
              {currentState.message || "Durum, personel ve notlar aynı çekirdek kayıt üzerinden yönetilir."}
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
      {pending ? "Kaydediliyor..." : "Kaydı Güncelle"}
    </button>
  )
}

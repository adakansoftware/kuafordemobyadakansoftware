"use server"

import { AppointmentStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { AppointmentConflictError, updateAppointmentFromAdmin } from "@/lib/bookings-repository"
import { adminNotesSchema } from "@/lib/booking"
import { getCurrentRequestId } from "@/lib/http"
import { logEvent } from "@/lib/observability"
import {
  AdminAccessError,
  getAdminActorIdentifier,
  getRequestIpAddress,
  RequestSecurityError,
  requireAdminAccess,
  verifyTrustedOrigin,
} from "@/lib/security"

export type UpdateAppointmentActionState = {
  success: boolean
  message: string
  appointmentId?: string
}

const validStatuses = new Set<AppointmentStatus>([
  AppointmentStatus.NEW,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
])

export async function updateAppointmentAction(
  _previousState: UpdateAppointmentActionState,
  formData: FormData
): Promise<UpdateAppointmentActionState> {
  try {
    await requireAdminAccess()
    await verifyTrustedOrigin({ allowHostFallback: true })
  } catch (error) {
    logEvent({
      level: "warn",
      event: "admin_appointment_security_failed",
      route: "/admin",
      message: error instanceof Error ? error.message : "Admin appointment action security failed.",
    })

    const message =
      error instanceof AdminAccessError
        ? "Bu islem icin yonetim erisimi dogrulanamadi."
        : error instanceof RequestSecurityError
          ? "Istek kaynagi dogrulanamadi."
          : "Guvenlik dogrulamasi basarisiz oldu."

    return {
      success: false,
      message,
    }
  }

  const appointmentId = String(formData.get("appointmentId") ?? "").trim()
  const statusValue = String(formData.get("status") ?? "").trim()
  const staffId = String(formData.get("staffId") ?? "").trim()
  const notes = String(formData.get("notes") ?? "").trim()

  if (!appointmentId) {
    logEvent({
      level: "warn",
      event: "admin_appointment_missing_id",
      route: "/admin",
      message: "Admin appointment update called without appointment id.",
    })

    return {
      success: false,
      message: "Randevu kaydi bulunamadi.",
    }
  }

  if (!validStatuses.has(statusValue as AppointmentStatus)) {
    logEvent({
      level: "warn",
      event: "admin_appointment_invalid_status",
      route: "/admin",
      message: "Admin appointment update received invalid status.",
      meta: {
        appointmentId,
        statusValue,
      },
    })

    return {
      success: false,
      message: "Gecersiz durum secildi.",
      appointmentId,
    }
  }

  const validatedNotes = adminNotesSchema.safeParse(notes)

  if (!validatedNotes.success) {
    logEvent({
      level: "warn",
      event: "admin_appointment_invalid_notes",
      route: "/admin",
      message: "Admin appointment update notes validation failed.",
      meta: {
        appointmentId,
      },
    })

    return {
      success: false,
      message: validatedNotes.error.issues[0]?.message ?? "Operasyon notu gecersiz.",
      appointmentId,
    }
  }

  try {
    await updateAppointmentFromAdmin({
      appointmentId,
      status: statusValue as AppointmentStatus,
      staffId: staffId || null,
      notes: validatedNotes.data,
      actorIdentifier: await getAdminActorIdentifier(),
      requestId: await getCurrentRequestId(),
      ipAddress: await getRequestIpAddress(),
    })

    revalidatePath("/admin")
    revalidatePath("/randevu")

    logEvent({
      event: "admin_appointment_updated",
      route: "/admin",
      message: "Admin appointment updated successfully.",
      meta: {
        appointmentId,
        statusValue,
        hasStaffAssignment: Boolean(staffId),
      },
    })

    return {
      success: true,
      message: "Randevu kaydi guncellendi.",
      appointmentId,
    }
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      logEvent({
        level: "warn",
        event: "admin_appointment_conflict",
        route: "/admin",
        message: error.message,
        meta: {
          appointmentId,
          statusValue,
        },
      })

      return {
        success: false,
        message: error.message,
        appointmentId,
      }
    }

    logEvent({
      level: "error",
      event: "admin_appointment_update_failed",
      route: "/admin",
      message: error instanceof Error ? error.message : "Unexpected admin appointment update error.",
      meta: {
        appointmentId,
        statusValue,
      },
    })

    return {
      success: false,
      message: "Guncelleme sirasinda beklenmeyen bir hata olustu.",
      appointmentId,
    }
  }
}

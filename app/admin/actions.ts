"use server"

import { AppointmentStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import {
  getAdminAppointmentRateLimitMessage,
  isValidAppointmentStatus,
  mapAdminAppointmentSecurityError,
  mapAdminAppointmentUpdateError,
} from "@/lib/admin-appointment-action"
import { AppointmentConflictError, updateAppointmentFromAdmin } from "@/lib/bookings-repository"
import { adminNotesSchema } from "@/lib/booking"
import { getCurrentRequestId } from "@/lib/http"
import { logEvent } from "@/lib/observability"
import { applyRateLimit } from "@/lib/rate-limit"
import {
  getAdminActorIdentifier,
  getRequestIpAddress,
  requireAdminAccess,
  verifyTrustedOrigin,
} from "@/lib/security"

export type UpdateAppointmentActionState = {
  success: boolean
  message: string
  appointmentId?: string
}

export async function updateAppointmentAction(
  _previousState: UpdateAppointmentActionState,
  formData: FormData
): Promise<UpdateAppointmentActionState> {
  const requestId = await getCurrentRequestId()
  const ipAddress = await getRequestIpAddress()

  try {
    await requireAdminAccess()
    await verifyTrustedOrigin({ allowHostFallback: true })
  } catch (error) {
    logEvent({
      level: "warn",
      event: "admin_appointment_security_failed",
      requestId,
      route: "/admin",
      message: error instanceof Error ? error.message : "Admin appointment action security failed.",
      meta: {
        ipAddress,
      },
    })

    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error),
    }
  }

  const appointmentId = String(formData.get("appointmentId") ?? "").trim()
  const statusValue = String(formData.get("status") ?? "").trim()
  const staffId = String(formData.get("staffId") ?? "").trim()
  const notes = String(formData.get("notes") ?? "").trim()
  const actorIdentifier = await getAdminActorIdentifier()

  if (!appointmentId) {
    logEvent({
      level: "warn",
      event: "admin_appointment_missing_id",
      requestId,
      route: "/admin",
      message: "Admin appointment update called without appointment id.",
      meta: {
        actorIdentifier,
        ipAddress,
      },
    })

    return {
      success: false,
      message: "Randevu kaydi bulunamadi.",
    }
  }

  if (!isValidAppointmentStatus(statusValue)) {
    logEvent({
      level: "warn",
      event: "admin_appointment_invalid_status",
      requestId,
      route: "/admin",
      message: "Admin appointment update received invalid status.",
      meta: {
        appointmentId,
        actorIdentifier,
        ipAddress,
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
      requestId,
      route: "/admin",
      message: "Admin appointment update notes validation failed.",
      meta: {
        appointmentId,
        actorIdentifier,
        ipAddress,
      },
    })

    return {
      success: false,
      message: validatedNotes.error.issues[0]?.message ?? "Operasyon notu gecersiz.",
      appointmentId,
    }
  }

  const rateLimit = await applyRateLimit({
    key: `${ipAddress}:${actorIdentifier ?? "admin"}`,
    namespace: "admin-appointment-write",
    limit: 60,
    windowMs: 60_000,
  })

  if (!rateLimit.allowed) {
    logEvent({
      level: "warn",
      event: "admin_appointment_rate_limited",
      requestId,
      route: "/admin",
      message: "Admin appointment update was rate limited.",
      meta: {
        appointmentId,
        actorIdentifier,
        ipAddress,
        rateLimitSource: rateLimit.source,
      },
    })

    return {
      success: false,
      message: getAdminAppointmentRateLimitMessage(),
      appointmentId,
    }
  }

  try {
    await updateAppointmentFromAdmin({
      appointmentId,
      status: statusValue as AppointmentStatus,
      staffId: staffId || null,
      notes: validatedNotes.data,
      actorIdentifier,
      requestId,
      ipAddress,
    })

    revalidatePath("/admin")
    revalidatePath("/randevu")

    logEvent({
      event: "admin_appointment_updated",
      requestId,
      route: "/admin",
      message: "Admin appointment updated successfully.",
      meta: {
        appointmentId,
        actorIdentifier,
        ipAddress,
        rateLimitSource: rateLimit.source,
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
        requestId,
        route: "/admin",
        message: error.message,
        meta: {
          appointmentId,
          actorIdentifier,
          ipAddress,
          statusValue,
        },
      })

      return {
        success: false,
        message: mapAdminAppointmentUpdateError(error),
        appointmentId,
      }
    }

    logEvent({
      level: "error",
      event: "admin_appointment_update_failed",
      requestId,
      route: "/admin",
      message: error instanceof Error ? error.message : "Unexpected admin appointment update error.",
      meta: {
        appointmentId,
        actorIdentifier,
        ipAddress,
        statusValue,
      },
    })

    return {
      success: false,
      message: mapAdminAppointmentUpdateError(error),
      appointmentId,
    }
  }
}

"use server"

import { AppointmentStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import {
  businessSettingsSchema,
  customerNotesSchema,
  mapAdminPaymentError,
  mapBusinessSettingsError,
  mapCustomerNotesError,
  paymentSchema,
} from "@/lib/admin-ops"
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
  AdminPaymentError,
  recordAppointmentPayment,
  updateBusinessSettings,
  updateCustomerNotes,
} from "@/lib/salon-ops-repository"
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

export type RecordPaymentActionState = {
  success: boolean
  message: string
  appointmentId?: string
}

export type BusinessSettingsActionState = {
  success: boolean
  message: string
}

export type CustomerNotesActionState = {
  success: boolean
  message: string
  customerId?: string
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
    return {
      success: false,
      message: "Randevu kaydi bulunamadi.",
    }
  }

  if (!isValidAppointmentStatus(statusValue)) {
    return {
      success: false,
      message: "Gecersiz durum secildi.",
      appointmentId,
    }
  }

  const validatedNotes = adminNotesSchema.safeParse(notes)

  if (!validatedNotes.success) {
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

    return {
      success: true,
      message: "Randevu kaydi guncellendi.",
      appointmentId,
    }
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
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

export async function recordAppointmentPaymentAction(
  _previousState: RecordPaymentActionState,
  formData: FormData
): Promise<RecordPaymentActionState> {
  const requestId = await getCurrentRequestId()
  const ipAddress = await getRequestIpAddress()

  try {
    await requireAdminAccess()
    await verifyTrustedOrigin({ allowHostFallback: true })
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error),
    }
  }

  const actorIdentifier = await getAdminActorIdentifier()
  const validation = paymentSchema.safeParse({
    appointmentId: formData.get("appointmentId"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    note: formData.get("note"),
  })

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Odeme formu gecersiz.",
      appointmentId: String(formData.get("appointmentId") ?? "").trim() || undefined,
    }
  }

  const rateLimit = await applyRateLimit({
    key: `${ipAddress}:${actorIdentifier ?? "admin"}`,
    namespace: "admin-payment-write",
    limit: 60,
    windowMs: 60_000,
  })

  if (!rateLimit.allowed) {
    return {
      success: false,
      message: getAdminAppointmentRateLimitMessage(),
      appointmentId: validation.data.appointmentId,
    }
  }

  try {
    const result = await recordAppointmentPayment({
      ...validation.data,
      actorIdentifier,
      requestId,
      ipAddress,
    })

    revalidatePath("/admin")
    revalidatePath(`/admin/customers/${result.appointment.customerId}`)

    return {
      success: true,
      message: "Odeme kaydi alindi.",
      appointmentId: validation.data.appointmentId,
    }
  } catch (error) {
    if (error instanceof AdminPaymentError) {
      return {
        success: false,
        message: mapAdminPaymentError(error),
        appointmentId: validation.data.appointmentId,
      }
    }

    logEvent({
      level: "error",
      event: "admin_payment_failed",
      requestId,
      route: "/admin",
      message: error instanceof Error ? error.message : "Unexpected payment action error.",
      meta: {
        appointmentId: validation.data.appointmentId,
        actorIdentifier,
        ipAddress,
      },
    })

    return {
      success: false,
      message: mapAdminPaymentError(error),
      appointmentId: validation.data.appointmentId,
    }
  }
}

export async function updateBusinessSettingsAction(
  _previousState: BusinessSettingsActionState,
  formData: FormData
): Promise<BusinessSettingsActionState> {
  const requestId = await getCurrentRequestId()
  const ipAddress = await getRequestIpAddress()

  try {
    await requireAdminAccess()
    await verifyTrustedOrigin({ allowHostFallback: true })
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error),
    }
  }

  const actorIdentifier = await getAdminActorIdentifier()
  const validation = businessSettingsSchema.safeParse({
    businessName: formData.get("businessName"),
    tagline: formData.get("tagline"),
    phone: formData.get("phone"),
    whatsappPhone: formData.get("whatsappPhone"),
    email: formData.get("email"),
    address: formData.get("address"),
    city: formData.get("city"),
    currency: formData.get("currency"),
    dailyCapacity: formData.get("dailyCapacity"),
    workingHoursNote: formData.get("workingHoursNote"),
  })

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Isletme ayarlari formu gecersiz.",
    }
  }

  try {
    await updateBusinessSettings({
      ...validation.data,
      actorIdentifier,
      requestId,
      ipAddress,
    })

    revalidatePath("/admin")

    return {
      success: true,
      message: "Isletme ayarlari guncellendi.",
    }
  } catch (error) {
    logEvent({
      level: "error",
      event: "admin_business_settings_failed",
      requestId,
      route: "/admin",
      message: error instanceof Error ? error.message : "Unexpected business settings update error.",
      meta: {
        actorIdentifier,
        ipAddress,
      },
    })

    return {
      success: false,
      message: mapBusinessSettingsError(),
    }
  }
}

export async function updateCustomerNotesAction(
  _previousState: CustomerNotesActionState,
  formData: FormData
): Promise<CustomerNotesActionState> {
  const requestId = await getCurrentRequestId()
  const ipAddress = await getRequestIpAddress()

  try {
    await requireAdminAccess()
    await verifyTrustedOrigin({ allowHostFallback: true })
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error),
    }
  }

  const actorIdentifier = await getAdminActorIdentifier()
  const validation = customerNotesSchema.safeParse({
    customerId: formData.get("customerId"),
    notes: formData.get("notes"),
  })

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Musteri notu gecersiz.",
      customerId: String(formData.get("customerId") ?? "").trim() || undefined,
    }
  }

  try {
    await updateCustomerNotes({
      ...validation.data,
      actorIdentifier,
      requestId,
      ipAddress,
    })

    revalidatePath(`/admin/customers/${validation.data.customerId}`)
    revalidatePath("/admin")

    return {
      success: true,
      message: "Musteri notu guncellendi.",
      customerId: validation.data.customerId,
    }
  } catch (error) {
    logEvent({
      level: "error",
      event: "admin_customer_notes_failed",
      requestId,
      route: `/admin/customers/${validation.data.customerId}`,
      message: error instanceof Error ? error.message : "Unexpected customer notes update error.",
      meta: {
        customerId: validation.data.customerId,
        actorIdentifier,
        ipAddress,
      },
    })

    return {
      success: false,
      message: mapCustomerNotesError(),
      customerId: validation.data.customerId,
    }
  }
}

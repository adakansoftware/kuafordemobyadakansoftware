"use server"

import { AppointmentStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import {
  businessSettingsSchema,
  customerNotesSchema,
  mapAdminPaymentError,
  mapBusinessSettingsError,
  mapCustomerNotesError,
  paymentSchema,
  productSaleSchema,
  staffAvailabilitySchema,
  staffTimeOffSchema,
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
import { buildRequestFingerprint } from "@/lib/request-security"
import { applyRateLimit } from "@/lib/rate-limit"
import {
  AdminPaymentError,
  createStaffTimeOff,
  recordInventorySale,
  recordAppointmentPayment,
  SubscriptionFeatureError,
  upsertStaffAvailability,
  updateBusinessSettings,
  updateCustomerNotes,
} from "@/lib/salon-ops-repository"
import {
  getRequestIpAddress,
  requireCriticalAdminStepUp,
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

export type StaffAvailabilityActionState = {
  success: boolean
  message: string
}

export type StaffTimeOffActionState = {
  success: boolean
  message: string
}

export type ProductSaleActionState = {
  success: boolean
  message: string
}

function isHighRiskAppointmentMutation(statusValue: string, currentStatus?: AppointmentStatus | null) {
  return (
    statusValue === AppointmentStatus.CANCELLED ||
    statusValue === AppointmentStatus.COMPLETED ||
    (currentStatus ? statusValue !== currentStatus : false)
  )
}

async function requireAdminMutationGuard(namespace: string, requestId: string) {
  const ipAddress = await getRequestIpAddress()
  const accessContext = await requireAdminAccess()
  await verifyTrustedOrigin({ allowHostFallback: true })

  const actorIdentifier = accessContext.actorIdentifier
  const requestHeaders = await headers()
  const fingerprint = buildRequestFingerprint(requestHeaders, {
    namespace,
    actorIdentifier,
  })
  const rateLimit = await applyRateLimit({
    key: `${ipAddress}:${actorIdentifier}:${fingerprint}`,
    namespace,
    limit: 45,
    windowMs: 60_000,
  })

  if (!rateLimit.allowed) {
    logEvent({
      level: "warn",
      event: "admin_mutation_rate_limited",
      requestId,
      route: "/admin",
      message: "Admin mutation request was rate limited.",
      meta: {
        actorIdentifier,
        ipAddress,
        namespace,
        rateLimitSource: rateLimit.source,
      },
    })

    throw new Error(getAdminAppointmentRateLimitMessage())
  }

  return {
    accessContext,
    actorIdentifier,
    ipAddress,
  }
}

export async function updateAppointmentAction(
  _previousState: UpdateAppointmentActionState,
  formData: FormData
): Promise<UpdateAppointmentActionState> {
  const requestId = await getCurrentRequestId()
  let accessContext
  let actorIdentifier = "admin"
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-appointment-write", requestId)
    accessContext = guard.accessContext
    actorIdentifier = guard.actorIdentifier
    ipAddress = guard.ipAddress
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
  const currentStatusValue = String(formData.get("currentStatus") ?? "").trim()
  const statusValue = String(formData.get("status") ?? "").trim()
  const staffId = String(formData.get("staffId") ?? "").trim()
  const notes = String(formData.get("notes") ?? "").trim()
  const adminPassword = String(formData.get("adminPassword") ?? "")

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

  if (isHighRiskAppointmentMutation(statusValue, currentStatusValue as AppointmentStatus | null)) {
    try {
      await requireCriticalAdminStepUp({
        accessContext,
        password: adminPassword,
      })
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Ek yonetici dogrulamasi basarisiz oldu.",
        appointmentId,
      }
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
      tenantId: accessContext?.tenantId,
      accessContext,
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
  let accessContext
  let actorIdentifier = "admin"
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-payment-write", requestId)
    accessContext = guard.accessContext
    actorIdentifier = guard.actorIdentifier
    ipAddress = guard.ipAddress
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error),
    }
  }

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

  try {
    await requireCriticalAdminStepUp({
      accessContext,
      password: String(formData.get("adminPassword") ?? ""),
    })
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Ek yonetici dogrulamasi basarisiz oldu.",
      appointmentId: validation.data.appointmentId,
    }
  }

  try {
    const result = await recordAppointmentPayment({
      ...validation.data,
      actorIdentifier,
      requestId,
      ipAddress,
      tenantId: accessContext?.tenantId,
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
  let accessContext
  let actorIdentifier = "admin"
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-business-settings-write", requestId)
    accessContext = guard.accessContext
    actorIdentifier = guard.actorIdentifier
    ipAddress = guard.ipAddress
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error),
    }
  }

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
    await requireCriticalAdminStepUp({
      accessContext,
      password: String(formData.get("adminPassword") ?? ""),
    })
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Ek yonetici dogrulamasi basarisiz oldu.",
    }
  }

  try {
    await updateBusinessSettings({
      ...validation.data,
      actorIdentifier,
      requestId,
      ipAddress,
      tenantId: accessContext?.tenantId,
      accessContext,
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
  let accessContext
  let actorIdentifier = "admin"
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-customer-notes-write", requestId)
    accessContext = guard.accessContext
    actorIdentifier = guard.actorIdentifier
    ipAddress = guard.ipAddress
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error),
    }
  }

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
      tenantId: accessContext?.tenantId,
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

export async function updateStaffAvailabilityAction(
  _previousState: StaffAvailabilityActionState,
  formData: FormData
): Promise<StaffAvailabilityActionState> {
  const requestId = await getCurrentRequestId()
  let accessContext
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-staff-availability-write", requestId)
    accessContext = guard.accessContext
    ipAddress = guard.ipAddress
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error),
    }
  }

  const validation = staffAvailabilitySchema.safeParse({
    staffId: formData.get("staffId"),
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    breakStartTime: formData.get("breakStartTime"),
    breakEndTime: formData.get("breakEndTime"),
  })

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Personel musaitlik formu gecersiz.",
    }
  }

  try {
    await upsertStaffAvailability({
      ...validation.data,
      actorIdentifier: accessContext.actorIdentifier,
      requestId,
      ipAddress,
      tenantId: accessContext.tenantId,
    })

    revalidatePath("/admin/staff")

    return {
      success: true,
      message: "Personel musaitligi guncellendi.",
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Musaitlik guncellenemedi.",
    }
  }
}

export async function createStaffTimeOffAction(
  _previousState: StaffTimeOffActionState,
  formData: FormData
): Promise<StaffTimeOffActionState> {
  const requestId = await getCurrentRequestId()
  let accessContext
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-staff-timeoff-write", requestId)
    accessContext = guard.accessContext
    ipAddress = guard.ipAddress
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error),
    }
  }

  const validation = staffTimeOffSchema.safeParse({
    staffId: formData.get("staffId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    isAllDay: formData.get("isAllDay"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    reason: formData.get("reason"),
  })

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Izin formu gecersiz.",
    }
  }

  try {
    await createStaffTimeOff({
      staffId: validation.data.staffId,
      startDate: validation.data.startDate,
      endDate: validation.data.endDate,
      isAllDay: validation.data.isAllDay === true || validation.data.isAllDay === "true",
      startTime: validation.data.startTime,
      endTime: validation.data.endTime,
      reason: validation.data.reason,
      actorIdentifier: accessContext.actorIdentifier,
      requestId,
      ipAddress,
      tenantId: accessContext.tenantId,
    })

    revalidatePath("/admin/staff")

    return {
      success: true,
      message: "Personel izin kaydi olusturuldu.",
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Izin kaydi olusturulamadi.",
    }
  }
}

export async function recordProductSaleAction(
  _previousState: ProductSaleActionState,
  formData: FormData
): Promise<ProductSaleActionState> {
  const requestId = await getCurrentRequestId()
  let accessContext
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-product-sale-write", requestId)
    accessContext = guard.accessContext
    ipAddress = guard.ipAddress
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error),
    }
  }

  const validation = productSaleSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    customerId: formData.get("customerId"),
    staffId: formData.get("staffId"),
    method: formData.get("method"),
    note: formData.get("note"),
  })

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Satis formu gecersiz.",
    }
  }

  try {
    await requireCriticalAdminStepUp({
      accessContext,
      password: String(formData.get("adminPassword") ?? ""),
    })
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Ek yonetici dogrulamasi basarisiz oldu.",
    }
  }

  try {
    await recordInventorySale({
      productId: validation.data.productId,
      quantity: validation.data.quantity,
      customerId: validation.data.customerId || null,
      staffId: validation.data.staffId || null,
      paymentMethod: validation.data.method,
      note: validation.data.note,
      actorIdentifier: accessContext.actorIdentifier,
      requestId,
      ipAddress,
      tenantId: accessContext.tenantId,
    })

    revalidatePath("/admin/inventory")

    return {
      success: true,
      message: "Urun satisi kaydedildi.",
    }
  } catch (error) {
    const message =
      error instanceof SubscriptionFeatureError || error instanceof Error
        ? error.message
        : "Urun satisi kaydedilemedi."

    return {
      success: false,
      message,
    }
  }
}

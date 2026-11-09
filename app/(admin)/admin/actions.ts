"use server"

import { AdminUserRole, AppointmentStatus, AuditActorType, AuditEvent } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { decryptAdminMfaSecret, encryptAdminMfaSecret, resolvePendingMfaEnrollmentToken, verifyTotpCode } from "@/lib/admin-mfa"
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
  type AdminAppointmentActionMessages,
} from "@/lib/admin-appointment-action"
import { getAdminMessages, getAdminLocale } from "@/lib/i18n/admin"
import { enqueueAppointmentNotifications } from "@/lib/notifications/notification-service"
import { AppointmentConflictError, updateAppointmentFromAdmin } from "@/lib/bookings-repository"
import { adminNotesSchema } from "@/lib/booking"
import { getCurrentRequestId } from "@/lib/http"
import { logEvent } from "@/lib/observability"
import { createAuditLog } from "@/lib/audit-log"
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
import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/password"
import {
  createAdminSession,
  revokeAllAdminSessionsForUser,
  setAdminSessionCookie,
} from "@/lib/admin-session"

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

export type AdminMfaActionState = {
  success: boolean
  message: string
}

export type AdminSessionControlActionState = {
  success: boolean
  message: string
}

export async function setAdminLocaleAction(formData: FormData) {
  const requested = String(formData.get("locale") ?? "")
  const locale = requested === "en" ? "en" : "tr"
  const { setAdminLocaleCookie } = await import("@/lib/i18n/admin")
  await setAdminLocaleCookie(locale)
  revalidatePath("/admin", "layout")
}

function isHighRiskAppointmentMutation(statusValue: string, currentStatus?: AppointmentStatus | null) {
  return (
    statusValue === AppointmentStatus.CANCELLED ||
    statusValue === AppointmentStatus.COMPLETED ||
    (currentStatus ? statusValue !== currentStatus : false)
  )
}

async function getActionMessages() {
  return getAdminMessages(await getAdminLocale()).actionMessages
}

async function requireAdminMutationGuard(
  namespace: string,
  requestId: string,
  securityMessages: AdminAppointmentActionMessages
) {
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

    throw new Error(getAdminAppointmentRateLimitMessage(securityMessages))
  }

  return {
    accessContext,
    actorIdentifier,
    ipAddress,
  }
}

async function rotateAdminSessionAfterSecurityChange(input: {
  tenantId: string
  adminUserId: string
}) {
  const session = await createAdminSession({
    tenantId: input.tenantId,
    adminUserId: input.adminUserId,
  })

  await setAdminSessionCookie(session.token, session.expiresAt)
}

export async function updateAppointmentAction(
  _previousState: UpdateAppointmentActionState,
  formData: FormData
): Promise<UpdateAppointmentActionState> {
  const requestId = await getCurrentRequestId()
  const t = await getActionMessages()
  let accessContext
  let actorIdentifier = "admin"
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-appointment-write", requestId, t.security)
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
      message: mapAdminAppointmentSecurityError(error, t.security),
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
      message: t.appointment.notFound,
    }
  }

  if (!isValidAppointmentStatus(statusValue)) {
    return {
      success: false,
      message: t.appointment.invalidStatus,
      appointmentId,
    }
  }

  const validatedNotes = adminNotesSchema.safeParse(notes)

  if (!validatedNotes.success) {
    return {
      success: false,
      message: validatedNotes.error.issues[0]?.message ?? t.appointment.invalidNotes,
      appointmentId,
    }
  }

  if (isHighRiskAppointmentMutation(statusValue, currentStatusValue as AppointmentStatus | null)) {
    try {
      await requireCriticalAdminStepUp({
        accessContext,
        password: adminPassword,
        totpCode: String(formData.get("adminTotpCode") ?? ""),
      })
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : t.appointment.stepUpFailed,
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

    try {
      if (statusValue === AppointmentStatus.CONFIRMED) {
        await enqueueAppointmentNotifications({
          appointmentId,
          templateKeys: ["appointment-confirmation", "reminder-24h"],
          requestId,
        })
      } else if (statusValue === AppointmentStatus.CANCELLED) {
        await enqueueAppointmentNotifications({
          appointmentId,
          templateKeys: ["appointment-cancelled"],
          requestId,
        })
      }
    } catch (error) {
      logEvent({
        level: "warn",
        event: "admin_appointment_notification_enqueue_failed",
        requestId,
        route: "/admin",
        message: error instanceof Error ? error.message : "Notification enqueue failed.",
        meta: { appointmentId, statusValue },
      })
    }

    return {
      success: true,
      message: t.appointment.updated,
      appointmentId,
    }
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return {
        success: false,
        message: mapAdminAppointmentUpdateError(error, t.security),
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
      message: mapAdminAppointmentUpdateError(error, t.security),
      appointmentId,
    }
  }
}

export async function recordAppointmentPaymentAction(
  _previousState: RecordPaymentActionState,
  formData: FormData
): Promise<RecordPaymentActionState> {
  const requestId = await getCurrentRequestId()
  const t = await getActionMessages()
  let accessContext
  let actorIdentifier = "admin"
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-payment-write", requestId, t.security)
    accessContext = guard.accessContext
    actorIdentifier = guard.actorIdentifier
    ipAddress = guard.ipAddress
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error, t.security),
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
      message: validation.error.issues[0]?.message ?? t.payment.invalidForm,
      appointmentId: String(formData.get("appointmentId") ?? "").trim() || undefined,
    }
  }

  try {
    await requireCriticalAdminStepUp({
      accessContext,
      password: String(formData.get("adminPassword") ?? ""),
      totpCode: String(formData.get("adminTotpCode") ?? ""),
    })
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : t.appointment.stepUpFailed,
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
      message: t.payment.recorded,
      appointmentId: validation.data.appointmentId,
    }
  } catch (error) {
    if (error instanceof AdminPaymentError) {
      return {
        success: false,
        message: mapAdminPaymentError(error, t.payment),
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
      message: mapAdminPaymentError(error, t.payment),
      appointmentId: validation.data.appointmentId,
    }
  }
}

export async function updateBusinessSettingsAction(
  _previousState: BusinessSettingsActionState,
  formData: FormData
): Promise<BusinessSettingsActionState> {
  const requestId = await getCurrentRequestId()
  const t = await getActionMessages()
  let accessContext
  let actorIdentifier = "admin"
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-business-settings-write", requestId, t.security)
    accessContext = guard.accessContext
    actorIdentifier = guard.actorIdentifier
    ipAddress = guard.ipAddress
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error, t.security),
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
      message: validation.error.issues[0]?.message ?? t.businessSettings.invalidForm,
    }
  }

  try {
    await requireCriticalAdminStepUp({
      accessContext,
      password: String(formData.get("adminPassword") ?? ""),
      totpCode: String(formData.get("adminTotpCode") ?? ""),
    })
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : t.appointment.stepUpFailed,
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
      message: t.businessSettings.updated,
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
      message: mapBusinessSettingsError(t.businessSettings),
    }
  }
}

export async function updateCustomerNotesAction(
  _previousState: CustomerNotesActionState,
  formData: FormData
): Promise<CustomerNotesActionState> {
  const requestId = await getCurrentRequestId()
  const t = await getActionMessages()
  let accessContext
  let actorIdentifier = "admin"
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-customer-notes-write", requestId, t.security)
    accessContext = guard.accessContext
    actorIdentifier = guard.actorIdentifier
    ipAddress = guard.ipAddress
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error, t.security),
    }
  }

  const validation = customerNotesSchema.safeParse({
    customerId: formData.get("customerId"),
    notes: formData.get("notes"),
  })

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? t.customerNotes.invalid,
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
      message: t.customerNotes.updated,
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
      message: mapCustomerNotesError(t.customerNotes),
      customerId: validation.data.customerId,
    }
  }
}

export async function updateStaffAvailabilityAction(
  _previousState: StaffAvailabilityActionState,
  formData: FormData
): Promise<StaffAvailabilityActionState> {
  const requestId = await getCurrentRequestId()
  const t = await getActionMessages()
  let accessContext
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-staff-availability-write", requestId, t.security)
    accessContext = guard.accessContext
    ipAddress = guard.ipAddress
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error, t.security),
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
      message: validation.error.issues[0]?.message ?? t.staffAvailability.invalidForm,
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
      message: t.staffAvailability.updated,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : t.staffAvailability.failed,
    }
  }
}

export async function createStaffTimeOffAction(
  _previousState: StaffTimeOffActionState,
  formData: FormData
): Promise<StaffTimeOffActionState> {
  const requestId = await getCurrentRequestId()
  const t = await getActionMessages()
  let accessContext
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-staff-timeoff-write", requestId, t.security)
    accessContext = guard.accessContext
    ipAddress = guard.ipAddress
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error, t.security),
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
      message: validation.error.issues[0]?.message ?? t.staffTimeOff.invalidForm,
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
      message: t.staffTimeOff.created,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : t.staffTimeOff.failed,
    }
  }
}

export async function recordProductSaleAction(
  _previousState: ProductSaleActionState,
  formData: FormData
): Promise<ProductSaleActionState> {
  const requestId = await getCurrentRequestId()
  const t = await getActionMessages()
  let accessContext
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-product-sale-write", requestId, t.security)
    accessContext = guard.accessContext
    ipAddress = guard.ipAddress
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error, t.security),
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
      message: validation.error.issues[0]?.message ?? t.productSale.invalidForm,
    }
  }

  try {
    await requireCriticalAdminStepUp({
      accessContext,
      password: String(formData.get("adminPassword") ?? ""),
      totpCode: String(formData.get("adminTotpCode") ?? ""),
    })
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : t.appointment.stepUpFailed,
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
      message: t.productSale.recorded,
    }
  } catch (error) {
    const message =
      error instanceof SubscriptionFeatureError || error instanceof Error
        ? error.message
        : t.productSale.failed

    return {
      success: false,
      message,
    }
  }
}

export async function configureAdminMfaAction(
  _previousState: AdminMfaActionState,
  formData: FormData
): Promise<AdminMfaActionState> {
  const requestId = await getCurrentRequestId()
  const t = await getActionMessages()
  let accessContext
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-mfa-write", requestId, t.security)
    accessContext = guard.accessContext
    ipAddress = guard.ipAddress
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error, t.security),
    }
  }

  if (!accessContext.adminUserId || accessContext.source !== "admin_session") {
    return {
      success: false,
      message: t.mfa.sessionRequired,
    }
  }

  const adminUser = await db.adminUser.findFirst({
    where: {
      id: accessContext.adminUserId,
      tenantId: accessContext.tenantId,
      isActive: true,
    },
    select: {
      id: true,
      username: true,
      passwordHash: true,
      mfaEnabledAt: true,
      mfaSecretCiphertext: true,
    },
  })

  if (!adminUser) {
    return {
      success: false,
      message: t.mfa.userNotFound,
    }
  }

  const adminPassword = String(formData.get("adminPassword") ?? "")
  const totpCode = String(formData.get("totpCode") ?? "")

  if (!(await verifyPassword(adminPassword, adminUser.passwordHash))) {
    logEvent({
      level: "warn",
      event: "admin_mfa_password_failed",
      requestId,
      route: "/admin/settings",
      message: "Admin MFA mutation password verification failed.",
      meta: {
        actorIdentifier: accessContext.actorIdentifier,
        ipAddress,
      },
    })

    return {
      success: false,
      message: t.mfa.passwordFailed,
    }
  }

  const intent = String(formData.get("intent") ?? "").trim()

  if (intent === "enable") {
    const enrollmentToken = String(formData.get("enrollmentToken") ?? "")
    const enrollment = resolvePendingMfaEnrollmentToken({
      enrollmentToken,
      adminUserId: adminUser.id,
    })

    if (!enrollment) {
      return {
        success: false,
        message: t.mfa.enrollmentInvalid,
      }
    }

    if (!verifyTotpCode({ secret: enrollment.secret, code: totpCode })) {
      return {
        success: false,
        message: t.mfa.totpFailed,
      }
    }

    await db.adminUser.update({
      where: { id: adminUser.id },
      data: {
        mfaSecretCiphertext: encryptAdminMfaSecret(enrollment.secret),
        mfaEnabledAt: new Date(),
      },
    })

    await createAuditLog({
      tenantId: accessContext.tenantId,
      actorType: AuditActorType.ADMIN,
      actorIdentifier: accessContext.actorIdentifier,
      event: AuditEvent.ADMIN_USER_UPDATED,
      targetType: "admin_user",
      targetId: adminUser.id,
      requestId,
      ipAddress,
      metadata: {
        action: "mfa_enabled",
        role: AdminUserRole.OWNER,
      },
    })

    await revokeAllAdminSessionsForUser({
      adminUserId: adminUser.id,
    })
    await rotateAdminSessionAfterSecurityChange({
      tenantId: accessContext.tenantId,
      adminUserId: adminUser.id,
    })

    revalidatePath("/admin/settings")

    return {
      success: true,
      message: t.mfa.enabled,
    }
  }

  if (intent === "disable") {
    if (!adminUser.mfaEnabledAt || !adminUser.mfaSecretCiphertext) {
      return {
        success: false,
        message: t.mfa.alreadyDisabled,
      }
    }

    const secret = decryptAdminMfaSecret(adminUser.mfaSecretCiphertext)

    if (!verifyTotpCode({ secret, code: totpCode })) {
      return {
        success: false,
        message: t.mfa.totpFailed,
      }
    }

    await db.adminUser.update({
      where: { id: adminUser.id },
      data: {
        mfaSecretCiphertext: null,
        mfaEnabledAt: null,
      },
    })

    await createAuditLog({
      tenantId: accessContext.tenantId,
      actorType: AuditActorType.ADMIN,
      actorIdentifier: accessContext.actorIdentifier,
      event: AuditEvent.ADMIN_USER_UPDATED,
      targetType: "admin_user",
      targetId: adminUser.id,
      requestId,
      ipAddress,
      metadata: {
        action: "mfa_disabled",
        role: AdminUserRole.OWNER,
      },
    })

    await revokeAllAdminSessionsForUser({
      adminUserId: adminUser.id,
    })
    await rotateAdminSessionAfterSecurityChange({
      tenantId: accessContext.tenantId,
      adminUserId: adminUser.id,
    })

    revalidatePath("/admin/settings")

    return {
      success: true,
      message: t.mfa.disabled,
    }
  }

  return {
    success: false,
    message: t.mfa.invalidIntent,
  }
}

export async function revokeAdminSessionsAction(
  _previousState: AdminSessionControlActionState,
  formData: FormData
): Promise<AdminSessionControlActionState> {
  const requestId = await getCurrentRequestId()
  const t = await getActionMessages()
  let accessContext
  let actorIdentifier = "admin"
  let ipAddress = "unknown"

  try {
    const guard = await requireAdminMutationGuard("admin-session-revoke", requestId, t.security)
    accessContext = guard.accessContext
    actorIdentifier = guard.actorIdentifier
    ipAddress = guard.ipAddress
  } catch (error) {
    return {
      success: false,
      message: mapAdminAppointmentSecurityError(error, t.security),
    }
  }

  if (!accessContext?.adminUserId) {
    return {
      success: false,
      message: t.sessionControl.sessionRequired,
    }
  }

  const adminUser = await db.adminUser.findFirst({
    where: {
      id: accessContext.adminUserId,
      tenantId: accessContext.tenantId,
      isActive: true,
    },
    select: {
      id: true,
      passwordHash: true,
      mfaEnabledAt: true,
      mfaSecretCiphertext: true,
    },
  })

  if (!adminUser) {
    return {
      success: false,
      message: t.mfa.userNotFound,
    }
  }

  const adminPassword = String(formData.get("adminPassword") ?? "")
  const totpCode = String(formData.get("totpCode") ?? "")

  if (!(await verifyPassword(adminPassword, adminUser.passwordHash))) {
    logEvent({
      level: "warn",
      event: "admin_session_revoke_password_failed",
      requestId,
      route: "/admin/settings",
      message: "Admin session revoke password verification failed.",
      meta: {
        actorIdentifier,
        ipAddress,
      },
    })

    return {
      success: false,
      message: t.mfa.passwordFailed,
    }
  }

  if (adminUser.mfaEnabledAt) {
    try {
      await requireCriticalAdminStepUp({
        accessContext,
        password: adminPassword,
        totpCode,
      })
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : t.appointment.stepUpFailed,
      }
    }
  }

  const revokedAt = await revokeAllAdminSessionsForUser({
    adminUserId: adminUser.id,
  })
  await rotateAdminSessionAfterSecurityChange({
    tenantId: accessContext.tenantId,
    adminUserId: adminUser.id,
  })

  await createAuditLog({
    tenantId: accessContext.tenantId,
    actorType: AuditActorType.ADMIN,
    actorIdentifier,
    event: AuditEvent.ADMIN_USER_UPDATED,
    targetType: "admin_user",
    targetId: adminUser.id,
    requestId,
    ipAddress,
    metadata: {
      action: "sessions_revoked",
      revokedAt: revokedAt.toISOString(),
    },
  })

  revalidatePath("/admin/settings")

  return {
    success: true,
    message: t.sessionControl.revoked,
  }
}

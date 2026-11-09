import { AppointmentStatus } from "@prisma/client"

const validStatuses = new Set<AppointmentStatus>([
  AppointmentStatus.NEW,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
])

export function isValidAppointmentStatus(value: string) {
  return validStatuses.has(value as AppointmentStatus)
}

export type AdminAppointmentActionMessages = {
  adminAccessDenied: string
  requestOriginDenied: string
  securityFailed: string
  rateLimited: string
  updateFailed: string
}

const defaultMessages: AdminAppointmentActionMessages = {
  adminAccessDenied: "Bu islem icin yonetim erisimi dogrulanamadi.",
  requestOriginDenied: "Istek kaynagi dogrulanamadi.",
  securityFailed: "Guvenlik dogrulamasi basarisiz oldu.",
  rateLimited: "Kisa sure icinde cok fazla guncelleme denemesi algilandi. Lutfen biraz sonra tekrar deneyin.",
  updateFailed: "Guncelleme sirasinda beklenmeyen bir hata olustu.",
}

export function mapAdminAppointmentSecurityError(
  error: unknown,
  messages: AdminAppointmentActionMessages = defaultMessages
) {
  if (error instanceof Error && error.name === "AdminAccessError") {
    return messages.adminAccessDenied
  }

  if (error instanceof Error && error.name === "RequestSecurityError") {
    return messages.requestOriginDenied
  }

  if (error instanceof Error && error.name === "AdminStepUpError") {
    return error.message
  }

  return messages.securityFailed
}

export function getAdminAppointmentRateLimitMessage(
  messages: Pick<AdminAppointmentActionMessages, "rateLimited"> = defaultMessages
) {
  return messages.rateLimited
}

export function mapAdminAppointmentUpdateError(
  error: unknown,
  messages: Pick<AdminAppointmentActionMessages, "updateFailed"> = defaultMessages
) {
  if (error instanceof Error && error.name === "AppointmentConflictError") {
    return error.message
  }

  return messages.updateFailed
}

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

export function mapAdminAppointmentSecurityError(error: unknown) {
  if (error instanceof Error && error.name === "AdminAccessError") {
    return "Bu islem icin yonetim erisimi dogrulanamadi."
  }

  if (error instanceof Error && error.name === "RequestSecurityError") {
    return "Istek kaynagi dogrulanamadi."
  }

  return "Guvenlik dogrulamasi basarisiz oldu."
}

export function getAdminAppointmentRateLimitMessage() {
  return "Kisa sure icinde cok fazla guncelleme denemesi algilandi. Lutfen biraz sonra tekrar deneyin."
}

export function mapAdminAppointmentUpdateError(error: unknown) {
  if (error instanceof Error && error.name === "AppointmentConflictError") {
    return error.message
  }

  return "Guncelleme sirasinda beklenmeyen bir hata olustu."
}

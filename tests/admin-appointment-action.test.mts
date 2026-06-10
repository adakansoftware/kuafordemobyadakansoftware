import assert from "node:assert/strict"
import {
  getAdminAppointmentRateLimitMessage,
  isValidAppointmentStatus,
  mapAdminAppointmentSecurityError,
  mapAdminAppointmentUpdateError,
} from "../lib/admin-appointment-action.ts"

export function runAdminAppointmentActionTests() {
  const adminError = new Error("auth")
  adminError.name = "AdminAccessError"

  const securityError = new Error("origin")
  securityError.name = "RequestSecurityError"

  const conflictError = new Error("Cakisiyor")
  conflictError.name = "AppointmentConflictError"

  assert.equal(isValidAppointmentStatus("NEW"), true)
  assert.equal(isValidAppointmentStatus("COMPLETED"), true)
  assert.equal(isValidAppointmentStatus("INVALID"), false)

  assert.equal(
    mapAdminAppointmentSecurityError(adminError),
    "Bu islem icin yonetim erisimi dogrulanamadi."
  )
  assert.equal(
    mapAdminAppointmentSecurityError(securityError),
    "Istek kaynagi dogrulanamadi."
  )
  assert.equal(
    mapAdminAppointmentSecurityError(new Error("other")),
    "Guvenlik dogrulamasi basarisiz oldu."
  )

  assert.equal(
    getAdminAppointmentRateLimitMessage(),
    "Kisa sure icinde cok fazla guncelleme denemesi algilandi. Lutfen biraz sonra tekrar deneyin."
  )
  assert.equal(mapAdminAppointmentUpdateError(conflictError), "Cakisiyor")
  assert.equal(
    mapAdminAppointmentUpdateError(new Error("other")),
    "Guncelleme sirasinda beklenmeyen bir hata olustu."
  )
}

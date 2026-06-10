import assert from "node:assert/strict"
import {
  getSubmitBookingRateLimitMessage,
  mapSubmitBookingCreateError,
  mapSubmitBookingSecurityError,
} from "../lib/booking-action.ts"

export function runBookingActionTests() {
  const securityError = new Error("blocked")
  securityError.name = "RequestSecurityError"

  const conflictError = new Error("Secilen saat dolu")
  conflictError.name = "AppointmentConflictError"

  const identityConflictError = new Error("Kimlik cakismasi")
  identityConflictError.name = "CustomerIdentityConflictError"

  assert.equal(
    mapSubmitBookingSecurityError(securityError),
    "Istek kaynagi dogrulanamadi. Sayfayi yenileyip yeniden deneyin."
  )
  assert.equal(mapSubmitBookingSecurityError(new Error("other")), null)
  assert.equal(
    getSubmitBookingRateLimitMessage(),
    "Kisa sure icinde cok fazla talep gonderildi. Lutfen bir dakika sonra tekrar deneyin."
  )
  assert.equal(mapSubmitBookingCreateError(identityConflictError), "Kimlik cakismasi")
  assert.equal(mapSubmitBookingCreateError(conflictError), "Secilen saat dolu")
  assert.equal(
    mapSubmitBookingCreateError(new Error("other")),
    "Randevu kaydedilirken beklenmeyen bir sorun olustu."
  )
}

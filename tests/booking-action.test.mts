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
    "İstek kaynağı doğrulanamadı. Sayfayı yenileyip yeniden deneyin."
  )
  assert.equal(mapSubmitBookingSecurityError(new Error("other")), null)
  assert.equal(
    getSubmitBookingRateLimitMessage(),
    "Kısa süre içinde çok fazla talep gönderildi. Lütfen bir dakika sonra tekrar deneyin."
  )
  assert.equal(mapSubmitBookingCreateError(identityConflictError), "Kimlik cakismasi")
  assert.equal(mapSubmitBookingCreateError(conflictError), "Secilen saat dolu")
  assert.equal(
    mapSubmitBookingCreateError(new Error("other")),
    "Randevu kaydedilirken beklenmeyen bir sorun oluştu."
  )
}

import { test } from "vitest"

test("booking-action suite", () => {
  runBookingActionTests()
})

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
    "Bu işlem için yönetim erişimi doğrulanamadı."
  )
  assert.equal(
    mapAdminAppointmentSecurityError(securityError),
    "İstek kaynağı doğrulanamadı."
  )
  assert.equal(
    mapAdminAppointmentSecurityError(new Error("other")),
    "Güvenlik doğrulaması başarısız oldu."
  )

  assert.equal(
    getAdminAppointmentRateLimitMessage(),
    "Kısa süre içinde çok fazla güncelleme denemesi algılandı. Lütfen biraz sonra tekrar deneyin."
  )
  assert.equal(mapAdminAppointmentUpdateError(conflictError), "Cakisiyor")
  assert.equal(
    mapAdminAppointmentUpdateError(new Error("other")),
    "Güncelleme sırasında beklenmeyen bir hata oluştu."
  )
}

import { test } from "vitest"

test("admin-appointment-action suite", () => {
  runAdminAppointmentActionTests()
})

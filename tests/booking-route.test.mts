import assert from "node:assert/strict"
import {
  BOOKING_ROUTE_ALLOW_HEADER,
  getBookingPostGuardFailure,
  getBookingRetryAfterSeconds,
  isValidAvailabilityDate,
  mapBookingCreateError,
  MAX_BOOKING_BODY_BYTES,
} from "../lib/booking-route.ts"

export function runBookingRouteTests() {
  assert.equal(BOOKING_ROUTE_ALLOW_HEADER, "GET, POST, OPTIONS")
  assert.equal(isValidAvailabilityDate("2099-06-06"), true)
  assert.equal(isValidAvailabilityDate("06.06.2099"), false)
  assert.equal(getBookingRetryAfterSeconds(65_000, 5_000), "60")

  assert.deepEqual(
    getBookingPostGuardFailure({
      contentType: "text/plain",
      contentLength: 10,
    }),
    {
      status: 415,
      message: "Istek bicimi desteklenmiyor.",
    }
  )

  assert.deepEqual(
    getBookingPostGuardFailure({
      contentType: "application/json",
      contentLength: MAX_BOOKING_BODY_BYTES + 1,
    }),
    {
      status: 413,
      message: "Istek boyutu siniri asildi.",
    }
  )

  assert.equal(
    getBookingPostGuardFailure({
      contentType: "application/json; charset=utf-8",
      contentLength: 256,
    }),
    null
  )

  const conflictError = new Error("Slot dolu")
  conflictError.name = "AppointmentConflictError"

  const identityConflictError = new Error("Kimlik cakismasi")
  identityConflictError.name = "CustomerIdentityConflictError"

  assert.deepEqual(mapBookingCreateError(identityConflictError), {
    status: 409,
    message: "Kimlik cakismasi",
  })
  assert.deepEqual(mapBookingCreateError(conflictError), {
    status: 409,
    message: "Slot dolu",
  })

  assert.deepEqual(mapBookingCreateError(new Error("boom")), {
    status: 500,
    message: "Randevu kaydi sirasinda beklenmeyen bir hata olustu.",
  })
}

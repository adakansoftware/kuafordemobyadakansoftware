import assert from "node:assert/strict"
import test from "node:test"
import {
  getBookingMinDate,
  isBookingTimeInPast,
  normalizeBookingDateInput,
  sanitizeBookingForm,
} from "../lib/booking.ts"

test("normalizeBookingDateInput converts local format to iso", () => {
  assert.equal(normalizeBookingDateInput("06.06.2026"), "2026-06-06")
  assert.equal(normalizeBookingDateInput("2026-06-06"), "2026-06-06")
})

test("sanitizeBookingForm trims and normalizes values", () => {
  const result = sanitizeBookingForm({
    service: "  sac-kesim-tasarim  ",
    date: " 2026-06-06 ",
    time: " 09:00 ",
    name: "  Ada   Kan  ",
    phone: " +90 (539) 941-65-21 ",
    email: " TEST@EXAMPLE.COM ",
    website: " ",
  })

  assert.equal(result.service, "sac-kesim-tasarim")
  assert.equal(result.name, "Ada Kan")
  assert.equal(result.phone, "+905399416521")
  assert.equal(result.email, "test@example.com")
})

test("getBookingMinDate returns iso date format", () => {
  assert.match(getBookingMinDate(), /^\d{4}-\d{2}-\d{2}$/)
})

test("isBookingTimeInPast returns false for distant future slot", () => {
  assert.equal(isBookingTimeInPast("2099-01-01", "10:00"), false)
})

import assert from "node:assert/strict"
import {
  getBookingMinDate,
  isBookingTimeInPast,
  normalizeBookingDateInput,
  sanitizeBookingForm,
  validateBookingForm,
} from "../lib/booking.ts"

export function runBookingTests() {
  assert.equal(normalizeBookingDateInput("06.06.2026"), "2026-06-06")
  assert.equal(normalizeBookingDateInput("2026-06-06"), "2026-06-06")

  const sanitized = sanitizeBookingForm({
    service: "  sac-kesim-tasarim  ",
    date: " 2026-06-06 ",
    time: " 09:00 ",
    name: "  Ada   Kan  ",
    phone: " +90 (539) 941-65-21 ",
    email: " TEST@EXAMPLE.COM ",
    website: " ",
  })

  assert.equal(sanitized.service, "sac-kesim-tasarim")
  assert.equal(sanitized.name, "Ada Kan")
  assert.equal(sanitized.phone, "+905399416521")
  assert.equal(sanitized.email, "test@example.com")
  assert.match(getBookingMinDate(), /^\d{4}-\d{2}-\d{2}$/)
  assert.equal(isBookingTimeInPast("2099-01-01", "10:00"), false)

  const validResult = validateBookingForm({
    service: " sac-kesim-tasarim ",
    date: "06.06.2099",
    time: "10:00",
    name: "  Ada   Kan  ",
    phone: " +90 (539) 941-65-21 ",
    email: " TEST@EXAMPLE.COM ",
    website: "",
  })

  assert.equal(validResult.success, true)

  if (validResult.success) {
    assert.equal(validResult.data.date, "2099-06-06")
    assert.equal(validResult.data.name, "Ada Kan")
    assert.equal(validResult.data.phone, "+905399416521")
    assert.equal(validResult.data.email, "test@example.com")
  }

  const pastDateResult = validateBookingForm({
    service: "sac-kesim-tasarim",
    date: "2000-01-01",
    time: "10:00",
    name: "Ada Kan",
    phone: "+905399416521",
    email: "test@example.com",
    website: "",
  })

  assert.equal(pastDateResult.success, false)

  if (!pastDateResult.success) {
    assert.equal(pastDateResult.errors.date, "Geçmiş bir tarih seçemezsiniz.")
  }

  const honeypotResult = validateBookingForm({
    service: "sac-kesim-tasarim",
    date: "2099-06-06",
    time: "10:00",
    name: "Ada Kan",
    phone: "+905399416521",
    email: "test@example.com",
    website: "https://spam.invalid",
  })

  assert.equal(honeypotResult.success, false)

  if (!honeypotResult.success) {
    assert.equal(typeof honeypotResult.errors.website, "string")
  }
}

import assert from "node:assert/strict"
import { test } from "vitest"

import {
  formatSalonDateIso,
  salonDateTimeToUtc,
  salonDayRange,
  salonDayOfWeek,
  salonOffsetString,
} from "../lib/time.ts"

test("salon offset is permanent +03:00 (January and July)", () => {
  assert.equal(salonOffsetString(), "+03:00")

  const january = salonDateTimeToUtc("2026-01-15", "12:00")
  const july = salonDateTimeToUtc("2026-07-15", "12:00")

  assert.equal(january.toISOString(), "2026-01-15T09:00:00.000Z")
  assert.equal(july.toISOString(), "2026-07-15T09:00:00.000Z")
})

test("salon day range covers the full salon-local day", () => {
  const { start, end } = salonDayRange("2026-01-15")

  assert.equal(start.toISOString(), "2026-01-14T21:00:00.000Z")
  assert.equal(end.toISOString(), "2026-01-15T20:59:59.999Z")
})

test("formatSalonDateIso matches old Istanbul formatting", () => {
  const january = new Date("2026-01-15T23:30:00Z")
  const july = new Date("2026-07-15T23:30:00Z")

  assert.equal(
    formatSalonDateIso(january),
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(january)
  )
  assert.equal(
    formatSalonDateIso(july),
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(july)
  )
})

test("salon day of week is Monday-based", () => {
  assert.equal(salonDayOfWeek("2026-01-12"), 1)
  assert.equal(salonDayOfWeek("2026-01-18"), 7)
  assert.equal(salonDayOfWeek("2026-07-15"), 3)
})

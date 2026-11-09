import assert from "node:assert/strict"
import {
  REMINDER_LEAD_MS,
  eligibleNotificationChannels,
  isConfirmationEnqueueable,
  isReminderEnqueueable,
  reminderScheduledFor,
} from "../lib/notifications/reminder-rules.ts"

export function runReminderRulesTests() {
  const now = new Date("2026-11-09T12:00:00.000Z")

  assert.equal(REMINDER_LEAD_MS, 24 * 60 * 60 * 1000)

  const scheduledAt = new Date("2026-11-12T10:00:00.000Z")
  assert.equal(
    reminderScheduledFor(scheduledAt).getTime(),
    scheduledAt.getTime() - REMINDER_LEAD_MS
  )

  // eligibleNotificationChannels
  assert.deepEqual(
    eligibleNotificationChannels(
      { email: "musteri@example.com", phone: "+905551112233" },
      { emailOptIn: true, smsOptIn: true }
    ),
    [
      { channel: "EMAIL", recipient: "musteri@example.com" },
      { channel: "SMS", recipient: "+905551112233" },
    ]
  )
  assert.deepEqual(
    eligibleNotificationChannels(
      { email: "musteri@example.com", phone: "+905551112233" },
      { emailOptIn: false, smsOptIn: true }
    ),
    [{ channel: "SMS", recipient: "+905551112233" }]
  )
  assert.deepEqual(
    eligibleNotificationChannels(
      { email: "musteri@example.com", phone: null },
      { emailOptIn: true, smsOptIn: true }
    ),
    [{ channel: "EMAIL", recipient: "musteri@example.com" }]
  )
  assert.deepEqual(
    eligibleNotificationChannels(
      { email: "musteri@example.com", phone: "+905551112233" },
      null
    ),
    []
  )

  // isReminderEnqueueable
  assert.equal(
    isReminderEnqueueable({ status: "CONFIRMED", scheduledAt: new Date("2026-11-20T10:00:00.000Z") }, now),
    true
  )
  assert.equal(
    isReminderEnqueueable({ status: "CANCELLED", scheduledAt: new Date("2026-11-20T10:00:00.000Z") }, now),
    false
  )
  assert.equal(
    isReminderEnqueueable({ status: "COMPLETED", scheduledAt: new Date("2026-11-20T10:00:00.000Z") }, now),
    false
  )
  // Past appointment
  assert.equal(
    isReminderEnqueueable({ status: "CONFIRMED", scheduledAt: new Date("2026-11-08T10:00:00.000Z") }, now),
    false
  )
  // Reminder time already past (< 24h lead remaining)
  assert.equal(
    isReminderEnqueueable({ status: "CONFIRMED", scheduledAt: new Date("2026-11-10T06:00:00.000Z") }, now),
    false
  )

  // isConfirmationEnqueueable
  assert.equal(isConfirmationEnqueueable({ status: "NEW", scheduledAt }), true)
  assert.equal(isConfirmationEnqueueable({ status: "CONFIRMED", scheduledAt }), true)
  assert.equal(isConfirmationEnqueueable({ status: "CANCELLED", scheduledAt }), false)
  assert.equal(isConfirmationEnqueueable({ status: "COMPLETED", scheduledAt }), false)
}

import { test } from "vitest"

test("reminder-rules suite", () => {
  runReminderRulesTests()
})

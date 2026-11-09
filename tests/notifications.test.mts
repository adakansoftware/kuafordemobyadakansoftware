import assert from "node:assert/strict"
import { NOTIFICATION_TEMPLATE_KEYS, renderNotificationDelivery } from "../lib/notifications/templates.ts"
import type {
  NotificationChannelAdapter,
  NotificationDelivery,
  NotificationDeliveryResult,
} from "../lib/notifications/types.ts"

class FakeNotificationAdapter implements NotificationChannelAdapter {
  readonly name = "fake"
  readonly channel: "EMAIL" | "SMS"

  deliveries: NotificationDelivery[] = []
  shouldFail = false

  constructor(channel: "EMAIL" | "SMS") {
    this.channel = channel
  }

  async send(delivery: NotificationDelivery): Promise<NotificationDeliveryResult> {
    if (this.shouldFail) {
      return { ok: false, error: "fake_failure" }
    }

    this.deliveries.push(delivery)
    return { ok: true, providerId: `fake-${this.deliveries.length}` }
  }
}

const baseContext = {
  templateKey: "appointment-confirmation",
  locale: "tr" as const,
  channel: "EMAIL" as const,
  customerName: "Ayse Yilmaz",
  serviceName: "Sac Kesim",
  businessName: "Adakan Kuafor",
  scheduledDate: "2026-11-12",
  scheduledTime: "14:00",
  staffName: "Mehmet",
}

export function runNotificationsTests() {
  assert.deepEqual(NOTIFICATION_TEMPLATE_KEYS, [
    "appointment-confirmation",
    "reminder-24h",
    "appointment-cancelled",
  ])

  // TR email rendering
  const trEmail = renderNotificationDelivery(baseContext, "musteri@example.com")
  assert.equal(trEmail.channel, "EMAIL")
  assert.equal(trEmail.recipient, "musteri@example.com")
  assert.equal(trEmail.subject, "Randevu kaydiniz alindi — Adakan Kuafor")
  assert.ok(trEmail.body.includes("Merhaba Ayse Yilmaz"))
  assert.ok(trEmail.body.includes("Hizmet: Sac Kesim — Mehmet"))
  assert.ok(trEmail.body.includes("Tarih: 12 Kasım 2026"))

  // TR SMS rendering
  const trSms = renderNotificationDelivery(
    { ...baseContext, channel: "SMS" },
    "+905551112233"
  )
  assert.equal(trSms.channel, "SMS")
  assert.ok(trSms.body.includes("Adakan Kuafor: Sac Kesim randevunuz"))
  assert.ok(!trSms.body.includes("Merhaba"))

  // EN email rendering
  const enEmail = renderNotificationDelivery(
    { ...baseContext, locale: "en" },
    "musteri@example.com"
  )
  assert.equal(enEmail.subject, "Appointment confirmed — Adakan Kuafor")
  assert.ok(enEmail.body.includes("Hello Ayse Yilmaz"))
  assert.ok(enEmail.body.includes("Date: 12 November 2026"))

  // EN reminder subject
  const enReminder = renderNotificationDelivery(
    { ...baseContext, locale: "en", templateKey: "reminder-24h" },
    "musteri@example.com"
  )
  assert.equal(enReminder.subject, "Reminder — your appointment is tomorrow — Adakan Kuafor")

  // Cancelled template
  const trCancelled = renderNotificationDelivery(
    { ...baseContext, templateKey: "appointment-cancelled" },
    "musteri@example.com"
  )
  assert.equal(trCancelled.subject, "Randevu iptal edildi — Adakan Kuafor")
  assert.ok(trCancelled.body.includes("iptal edildi"))

  // Fake adapter contract
  const adapter = new FakeNotificationAdapter("EMAIL")
  const okResult = adapter.send(trEmail)
  assert.ok(okResult instanceof Promise)

  void okResult.then((result) => {
    assert.equal(result.ok, true)
    assert.equal(result.providerId, "fake-1")
    assert.equal(adapter.deliveries.length, 1)
    assert.equal(adapter.deliveries[0]?.recipient, "musteri@example.com")

    adapter.shouldFail = true
    return adapter.send(trEmail).then((failedResult) => {
      assert.equal(failedResult.ok, false)
      assert.equal(failedResult.error, "fake_failure")
      assert.equal(adapter.deliveries.length, 1)
    })
  })
}

import { test } from "vitest"

test("notifications suite", async () => {
  runNotificationsTests()
})

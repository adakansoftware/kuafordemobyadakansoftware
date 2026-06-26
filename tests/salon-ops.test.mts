import assert from "node:assert/strict"
import { PaymentMethod } from "@prisma/client"
import {
  businessSettingsSchema,
  customerNotesSchema,
  mapAdminPaymentError,
  paymentSchema,
  staffAvailabilitySchema,
  staffTimeOffSchema,
} from "../lib/admin-ops.ts"
import {
  calculateAvailableDiscountCount,
  calculateCommissionAmount,
  calculateLoyaltyPoints,
  buildAppointmentWhatsAppMessages,
  buildCustomerWhatsAppUrl,
  getPaymentMethodLabel,
  getPaymentMethodOptions,
} from "../lib/salon-ops.ts"
import { getCustomerPortalSessionMaxAgeSeconds, normalizeCustomerPortalIdentifier } from "../lib/customer-portal.ts"
import { buildSetupServices, buildSetupStaffMembers, normalizeSetupSlug, parseSetupList } from "../lib/setup-wizard.ts"

export function runSalonOpsTests() {
  assert.equal(calculateCommissionAmount(2400, 15), 360)
  assert.equal(calculateCommissionAmount(-100, 20), 0)

  assert.equal(calculateLoyaltyPoints(0), 0)
  assert.equal(calculateLoyaltyPoints(5), 100)

  assert.equal(calculateAvailableDiscountCount(4), 0)
  assert.equal(calculateAvailableDiscountCount(5), 1)
  assert.equal(calculateAvailableDiscountCount(11), 2)

  assert.equal(getPaymentMethodLabel(PaymentMethod.CASH), "Nakit")
  assert.equal(getPaymentMethodLabel(PaymentMethod.CARD), "Kart")
  assert.equal(getPaymentMethodOptions().length, 4)

  const whatsappUrl = buildCustomerWhatsAppUrl("+90 (532) 111 00 01", "Merhaba")
  assert.equal(whatsappUrl, "https://wa.me/905321110001?text=Merhaba")
  assert.equal(buildCustomerWhatsAppUrl("", "Merhaba"), null)

  const messages = buildAppointmentWhatsAppMessages({
    customerName: "Zeynep",
    scheduledDate: "2026-06-11",
    scheduledTime: "14:00",
    serviceTitle: "Sac Boyama",
    businessName: "Adakan Hair Studio",
  })

  assert.equal(messages.confirmation.includes("randevunuz onaylandi"), true)
  assert.equal(messages.paymentReminder.includes("odeme kaydiniz bekleniyor"), true)
  assert.equal(normalizeCustomerPortalIdentifier(" Demo@Example.com "), "demo@example.com")
  assert.equal(normalizeCustomerPortalIdentifier("+90 (532) 111 00 01"), "905321110001")
  assert.equal(getCustomerPortalSessionMaxAgeSeconds(), 43200)

  assert.equal(normalizeSetupSlug(" Sac & Sakal Deluxe "), "sac-sakal-deluxe")
  assert.deepEqual(parseSetupList("Ali, ali, Ayse, , AYSE", { maxItems: 10 }), ["Ali", "Ayse"])
  assert.equal(buildSetupStaffMembers("Ali, ali, Ayse").length, 2)
  assert.equal(buildSetupServices("Sac Kesim, sac kesim, Boya")[0]?.slug, "setup-service-1-sac-kesim")

  const validPayment = paymentSchema.safeParse({
    appointmentId: "apt_1",
    amount: "2400",
    method: PaymentMethod.CARD,
    note: "POS",
  })
  assert.equal(validPayment.success, true)

  const invalidPayment = paymentSchema.safeParse({
    appointmentId: "",
    amount: "0",
    method: "INVALID",
    note: "",
  })
  assert.equal(invalidPayment.success, false)

  const validSettings = businessSettingsSchema.safeParse({
    businessName: "Adakan Hair Studio",
    tagline: "Operasyon merkezi",
    phone: "905399416521",
    whatsappPhone: "905399416521",
    email: "demo@example.com",
    address: "Cadde 1",
    city: "Istanbul",
    currency: "TRY",
    dailyCapacity: "24",
    workingHoursNote: "10:00-20:00",
  })
  assert.equal(validSettings.success, true)

  const invalidAvailability = staffAvailabilitySchema.safeParse({
    staffId: "staff_1",
    dayOfWeek: "2",
    startTime: "18:00",
    endTime: "10:00",
    breakStartTime: "",
    breakEndTime: "",
  })
  assert.equal(invalidAvailability.success, false)

  const validAvailability = staffAvailabilitySchema.safeParse({
    staffId: "staff_1",
    dayOfWeek: "2",
    startTime: "10:00",
    endTime: "18:00",
    breakStartTime: "13:00",
    breakEndTime: "14:00",
  })
  assert.equal(validAvailability.success, true)

  const invalidTimeOff = staffTimeOffSchema.safeParse({
    staffId: "staff_1",
    startDate: "2026-06-20",
    endDate: "2026-06-19",
    isAllDay: "false",
    startTime: "16:00",
    endTime: "10:00",
    reason: "Test",
  })
  assert.equal(invalidTimeOff.success, false)

  const validCustomerNotes = customerNotesSchema.safeParse({
    customerId: "cus_1",
    notes: "Renk tercihleri tutuldu.",
  })
  assert.equal(validCustomerNotes.success, true)

  const paymentError = new Error("Odeme zaten alinmis")
  paymentError.name = "AdminPaymentError"
  assert.equal(mapAdminPaymentError(paymentError), "Odeme zaten alinmis")
}

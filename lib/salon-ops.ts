import { PaymentMethod } from "@prisma/client"

export const LOYALTY_POINTS_PER_PAID_APPOINTMENT = 20
export const DISCOUNT_ELIGIBILITY_COMPLETED_APPOINTMENTS = 5

export function calculateCommissionAmount(amount: number, commissionRate: number) {
  return Math.max(Math.round((Math.max(amount, 0) * Math.max(commissionRate, 0)) / 100), 0)
}

export function calculateLoyaltyPoints(completedPaidAppointments: number) {
  return Math.max(completedPaidAppointments, 0) * LOYALTY_POINTS_PER_PAID_APPOINTMENT
}

export function calculateAvailableDiscountCount(completedPaidAppointments: number) {
  return Math.floor(Math.max(completedPaidAppointments, 0) / DISCOUNT_ELIGIBILITY_COMPLETED_APPOINTMENTS)
}

export function buildCustomerWhatsAppUrl(phone: string | null | undefined, message: string) {
  const normalizedPhone = (phone ?? "").replace(/[^\d]/g, "")

  if (!normalizedPhone) {
    return null
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
}

export function getPaymentMethodLabel(method: PaymentMethod) {
  switch (method) {
    case PaymentMethod.CASH:
      return "Nakit"
    case PaymentMethod.CARD:
      return "Kart"
    case PaymentMethod.IBAN:
      return "IBAN"
    default:
      return "Diger"
  }
}

export function getPaymentMethodOptions() {
  return [
    { value: PaymentMethod.CASH, label: getPaymentMethodLabel(PaymentMethod.CASH) },
    { value: PaymentMethod.CARD, label: getPaymentMethodLabel(PaymentMethod.CARD) },
    { value: PaymentMethod.IBAN, label: getPaymentMethodLabel(PaymentMethod.IBAN) },
    { value: PaymentMethod.OTHER, label: getPaymentMethodLabel(PaymentMethod.OTHER) },
  ]
}

export function buildAppointmentWhatsAppMessages(input: {
  customerName: string
  scheduledDate: string
  scheduledTime: string
  serviceTitle: string
  businessName: string
}) {
  const baseContext = `${input.businessName} / ${input.serviceTitle} / ${input.scheduledDate} ${input.scheduledTime}`

  return {
    reminder: `Merhaba ${input.customerName}, ${baseContext} icin randevu hatirlatmasi.`,
    confirmation: `Merhaba ${input.customerName}, ${baseContext} icin randevunuz onaylandi.`,
    cancellation: `Merhaba ${input.customerName}, ${baseContext} icin randevunuz iptal edildi.`,
    paymentReminder: `Merhaba ${input.customerName}, ${baseContext} icin odeme kaydiniz bekleniyor.`,
  }
}

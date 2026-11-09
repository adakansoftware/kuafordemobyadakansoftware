import { format } from "date-fns"
import { tr, enUS } from "date-fns/locale"
import type { Locale } from "../i18n/validation.ts"
import { salonDateTimeToUtc } from "../time.ts"
import type { NotificationDelivery } from "./types.ts"

export const NOTIFICATION_TEMPLATE_KEYS = [
  "appointment-confirmation",
  "reminder-24h",
  "appointment-cancelled",
] as const

export type NotificationTemplateKey = (typeof NOTIFICATION_TEMPLATE_KEYS)[number]

export type NotificationTemplateContext = {
  templateKey: NotificationTemplateKey
  locale: Locale
  channel: "EMAIL" | "SMS"
  customerName: string
  serviceName: string
  businessName: string
  scheduledDate: string
  scheduledTime: string
  staffName?: string | null
}

type TemplateBody = {
  subject: string
  email: string
  sms: string
}

function formatSalonDateTime(context: NotificationTemplateContext, pattern: string) {
  const instant = salonDateTimeToUtc(context.scheduledDate, context.scheduledTime)
  return format(instant, pattern, { locale: context.locale === "en" ? enUS : tr })
}

function buildTemplate(context: NotificationTemplateContext): TemplateBody {
  const dateLabel = formatSalonDateTime(context, "d MMMM yyyy HH:mm")
  const staffLabel = context.staffName ? ` — ${context.staffName}` : ""

  if (context.locale === "en") {
    switch (context.templateKey) {
      case "appointment-confirmation":
        return {
          subject: `Appointment confirmed — ${context.businessName}`,
          email:
            `Hello ${context.customerName},\n\n` +
            `Your appointment at ${context.businessName} has been recorded.\n\n` +
            `Service: ${context.serviceName}${staffLabel}\n` +
            `Date: ${dateLabel}\n\n` +
            `We look forward to seeing you.`,
          sms:
            `${context.businessName}: appointment for ${context.serviceName} on ${dateLabel} has been recorded. See you soon!`,
        }
      case "reminder-24h":
        return {
          subject: `Reminder — your appointment is tomorrow — ${context.businessName}`,
          email:
            `Hello ${context.customerName},\n\n` +
            `This is a reminder for your appointment tomorrow.\n\n` +
            `Service: ${context.serviceName}${staffLabel}\n` +
            `Date: ${dateLabel}\n\n` +
            `See you at ${context.businessName}.`,
          sms:
            `${context.businessName} reminder: ${context.serviceName} tomorrow at ${dateLabel}.`,
        }
      case "appointment-cancelled":
        return {
          subject: `Appointment cancelled — ${context.businessName}`,
          email:
            `Hello ${context.customerName},\n\n` +
            `Your appointment for ${context.serviceName} on ${dateLabel} has been cancelled.\n\n` +
            `You can book a new appointment any time.`,
          sms:
            `${context.businessName}: your ${context.serviceName} appointment on ${dateLabel} was cancelled.`,
        }
    }
  }

  switch (context.templateKey) {
    case "appointment-confirmation":
      return {
        subject: `Randevu kaydınız alındı — ${context.businessName}`,
        email:
          `Merhaba ${context.customerName},\n\n` +
          `${context.businessName} içindeki randevunuz kayda alındı.\n\n` +
          `Hizmet: ${context.serviceName}${staffLabel}\n` +
          `Tarih: ${dateLabel}\n\n` +
          `Sizi bekliyoruz.`,
        sms:
          `${context.businessName}: ${context.serviceName} randevunuz ${dateLabel} için kayda alındı. Görüşmek üzere!`,
      }
    case "reminder-24h":
      return {
        subject: `Hatırlatma — randevunuz yarın — ${context.businessName}`,
        email:
          `Merhaba ${context.customerName},\n\n` +
          `Yarınki randevunuz için hatırlatma.\n\n` +
          `Hizmet: ${context.serviceName}${staffLabel}\n` +
          `Tarih: ${dateLabel}\n\n` +
          `${context.businessName} içinde görüşmek üzere.`,
        sms:
          `${context.businessName} hatırlatma: ${context.serviceName} randevunuz yarın ${dateLabel}.`,
      }
    case "appointment-cancelled":
      return {
        subject: `Randevu iptal edildi — ${context.businessName}`,
        email:
          `Merhaba ${context.customerName},\n\n` +
          `${dateLabel} tarihindeki ${context.serviceName} randevunuz iptal edildi.\n\n` +
          `Dilediğiniz zaman yeni bir randevu oluşturabilirsiniz.`,
        sms:
          `${context.businessName}: ${dateLabel} tarihindeki ${context.serviceName} randevunuz iptal edildi.`,
      }
  }
}

export function renderNotificationDelivery(
  context: NotificationTemplateContext,
  recipient: string
): NotificationDelivery {
  const template = buildTemplate(context)

  return {
    channel: context.channel,
    recipient,
    subject: template.subject,
    body: context.channel === "SMS" ? template.sms : template.email,
  }
}

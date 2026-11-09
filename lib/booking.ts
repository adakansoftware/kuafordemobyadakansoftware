import { z } from "zod"
import { bookingValidationMessages, type BookingValidationMessages, type Locale } from "./i18n/validation.ts"
import { siteContent } from "./site-content.ts"
import { formatSalonDateIso, salonDateTimeToUtc } from "./time.ts"

export const bookingTimeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
] as const

export const bookingServiceSlugs = siteContent.services.map((service) => service.slug) as [string, ...string[]]

export function createBookingSchema(messages: BookingValidationMessages) {
  return z.object({
    service: z
      .string()
      .trim()
      .min(1, messages.serviceRequired)
      .regex(/^[a-z0-9-]+$/, messages.serviceInvalid),
    date: z
      .string()
      .min(1, messages.dateRequired)
      .regex(/^\d{4}-\d{2}-\d{2}$/, messages.dateInvalid),
    time: z.enum(bookingTimeSlots, {
      message: messages.timeRequired,
    }),
    name: z
      .string()
      .trim()
      .min(3, messages.nameTooShort)
      .max(80, messages.nameTooLong)
      .regex(/^[\p{L}\s'.-]+$/u, messages.nameInvalidChars),
    phone: z.string().trim().min(10, messages.phoneTooShort).max(20, messages.phoneTooLong),
    email: z.string().trim().email(messages.emailInvalid),
    website: z.string().trim().max(0).optional().default(""),
  })
}

export const bookingSchema = createBookingSchema(bookingValidationMessages.tr)

export type BookingFormValues = z.infer<typeof bookingSchema>
export type BookingFormDraft = {
  service: string
  date: string
  time: string
  name: string
  phone: string
  email: string
  website?: string
  formIssuedAt?: string
  formSignature?: string
  turnstileToken?: string
  clientFingerprint?: string
  notificationOptIn?: string
}

export type BookingFieldErrors = Partial<Record<keyof BookingFormValues, string>>

export const adminNotesSchema = z.string().trim().max(500, "Operasyon notu en fazla 500 karakter olabilir.")

export function sanitizeBookingForm(values: BookingFormDraft): BookingFormDraft {
  const normalizedPhone = values.phone.replace(/[^\d+]/g, "")

  return {
    service: values.service.trim(),
    date: values.date.trim(),
    time: values.time.trim(),
    name: values.name.replace(/\s+/g, " ").trim(),
    phone: normalizedPhone,
    email: values.email.trim().toLowerCase(),
    website: values.website?.trim() ?? "",
    formIssuedAt: values.formIssuedAt?.trim() ?? "",
    formSignature: values.formSignature?.trim() ?? "",
    turnstileToken: values.turnstileToken?.trim() ?? "",
    clientFingerprint: values.clientFingerprint?.trim() ?? "",
    notificationOptIn: values.notificationOptIn === "true" ? "true" : "",
  }
}

export function getBookingMinDate() {
  return formatSalonDateIso()
}

export function normalizeBookingDateInput(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return ""
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }

  const localizedMatch = trimmed.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/)

  if (localizedMatch) {
    const [, day, month, year] = localizedMatch
    return `${year}-${month}-${day}`
  }

  return ""
}

export function isBookingTimeInPast(date: string, time: string) {
  const now = new Date()
  const bookingDate = salonDateTimeToUtc(date, time)

  return bookingDate.getTime() < now.getTime() + 1000 * 60 * 30
}

export function validateBookingForm(values: BookingFormDraft, locale: Locale = "tr") {
  const messages = bookingValidationMessages[locale]
  const sanitizedValues = sanitizeBookingForm(values)
  sanitizedValues.date = normalizeBookingDateInput(sanitizedValues.date)
  const result = createBookingSchema(messages).safeParse(sanitizedValues)

  if (result.success) {
    if (result.data.date < getBookingMinDate()) {
      return {
        success: false as const,
        errors: {
          date: messages.dateInPast,
        } satisfies BookingFieldErrors,
      }
    }

    if (isBookingTimeInPast(result.data.date, result.data.time)) {
      return {
        success: false as const,
        errors: {
          time: messages.timeTooSoon,
        } satisfies BookingFieldErrors,
      }
    }

    return {
      success: true as const,
      data: result.data,
      errors: {} as BookingFieldErrors,
    }
  }

  const fieldErrors = result.error.flatten().fieldErrors

  return {
    success: false as const,
    errors: {
      service: fieldErrors.service?.[0],
      date: fieldErrors.date?.[0],
      time: fieldErrors.time?.[0],
      name: fieldErrors.name?.[0],
      phone: fieldErrors.phone?.[0],
      email: fieldErrors.email?.[0],
      website: fieldErrors.website?.[0],
    } satisfies BookingFieldErrors,
  }
}

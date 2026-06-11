import { z } from "zod"
import { siteContent } from "./site-content.ts"

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

export const bookingSchema = z.object({
  service: z
    .string()
    .trim()
    .min(1, "Lutfen bir hizmet secin.")
    .regex(/^[a-z0-9-]+$/, "Gecerli bir hizmet secin."),
  date: z
    .string()
    .min(1, "Lütfen bir tarih seçin.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih seçin."),
  time: z.enum(bookingTimeSlots, {
    message: "Lütfen bir saat seçin.",
  }),
  name: z
    .string()
    .trim()
    .min(3, "Ad soyad en az 3 karakter olmalı.")
    .max(80, "Ad soyad çok uzun.")
    .regex(/^[\p{L}\s'.-]+$/u, "Ad soyad alanında yalnızca harf kullanın."),
  phone: z.string().trim().min(10, "Telefon numarası eksik görünüyor.").max(20, "Telefon numarası çok uzun."),
  email: z.string().trim().email("Geçerli bir e-posta girin."),
  website: z.string().trim().max(0).optional().default(""),
})

export type BookingFormValues = z.infer<typeof bookingSchema>
export type BookingFormDraft = {
  service: string
  date: string
  time: string
  name: string
  phone: string
  email: string
  website?: string
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
  }
}

export function getBookingMinDate() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  const parts = formatter.formatToParts(new Date())
  const year = parts.find((part) => part.type === "year")?.value ?? ""
  const month = parts.find((part) => part.type === "month")?.value ?? ""
  const day = parts.find((part) => part.type === "day")?.value ?? ""

  return `${year}-${month}-${day}`
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
  const bookingDate = new Date(`${date}T${time}:00+03:00`)

  return bookingDate.getTime() < now.getTime() + 1000 * 60 * 30
}

export function validateBookingForm(values: BookingFormDraft) {
  const sanitizedValues = sanitizeBookingForm(values)
  sanitizedValues.date = normalizeBookingDateInput(sanitizedValues.date)
  const result = bookingSchema.safeParse(sanitizedValues)

  if (result.success) {
    if (result.data.date < getBookingMinDate()) {
      return {
        success: false as const,
        errors: {
          date: "Geçmiş bir tarih seçemezsiniz.",
        } satisfies BookingFieldErrors,
      }
    }

    if (isBookingTimeInPast(result.data.date, result.data.time)) {
      return {
        success: false as const,
        errors: {
          time: "Yaklaşan 30 dakika içindeki saatler için online talep alınmıyor. Lütfen daha ileri bir saat seçin.",
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

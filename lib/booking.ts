import { z } from "zod"
import { siteContent } from "@/lib/site-content"

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

export const bookingServiceSlugs = siteContent.services.map((service) => service.slug) as [
  string,
  ...string[],
]

export const bookingSchema = z.object({
  service: z.enum(bookingServiceSlugs, {
    message: "Lutfen bir hizmet secin.",
  }),
  date: z
    .string()
    .min(1, "Lutfen bir tarih secin.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Gecerli bir tarih secin."),
  time: z.enum(bookingTimeSlots, {
    message: "Lutfen bir saat secin.",
  }),
  name: z
    .string()
    .trim()
    .min(3, "Ad soyad en az 3 karakter olmali.")
    .max(80, "Ad soyad cok uzun."),
  phone: z
    .string()
    .trim()
    .min(10, "Telefon numarasi eksik gorunuyor.")
    .max(20, "Telefon numarasi cok uzun."),
  email: z.string().trim().email("Gecerli bir e-posta girin."),
})

export type BookingFormValues = z.infer<typeof bookingSchema>
export type BookingFormDraft = {
  service: string
  date: string
  time: string
  name: string
  phone: string
  email: string
}

export type BookingFieldErrors = Partial<Record<keyof BookingFormValues, string>>

export function getBookingMinDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date())
}

export function validateBookingForm(values: BookingFormDraft) {
  const result = bookingSchema.safeParse(values)

  if (result.success) {
    if (result.data.date < getBookingMinDate()) {
      return {
        success: false as const,
        errors: {
          date: "Gecmis bir tarih secemezsiniz.",
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
    } satisfies BookingFieldErrors,
  }
}

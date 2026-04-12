"use server"

import { AppointmentConflictError, createAppointmentFromWeb } from "@/lib/bookings-repository"
import { validateBookingForm, type BookingFormDraft } from "@/lib/booking"

export type SubmitBookingResult =
  | {
      success: true
      bookingId: string
      serviceTitle: string
      date: string
      time: string
      name: string
      message: string
    }
  | {
      success: false
      message: string
      errors?: Record<string, string | undefined>
    }

export async function submitBookingAction(values: BookingFormDraft): Promise<SubmitBookingResult> {
  const validation = validateBookingForm(values)

  if (!validation.success) {
    return {
      success: false,
      message: "Formdaki alanlari kontrol edin.",
      errors: validation.errors,
    }
  }

  try {
    const booking = await createAppointmentFromWeb(validation.data)

    return {
      success: true,
      bookingId: booking.id,
      serviceTitle: booking.service.title,
      date: booking.scheduledDate,
      time: booking.scheduledTime,
      name: booking.customer.name,
      message: "Randevu talebi basariyla kaydedildi.",
    }
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return {
        success: false,
        message: error.message,
      }
    }

    return {
      success: false,
      message: "Randevu kaydedilirken beklenmeyen bir sorun olustu.",
    }
  }
}

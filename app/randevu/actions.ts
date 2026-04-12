"use server"

import { AppointmentConflictError, createAppointmentFromWeb } from "@/lib/bookings-repository"
import { validateBookingForm, type BookingFormDraft } from "@/lib/booking"
import { RequestSecurityError, verifyTrustedOrigin } from "@/lib/security"

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
  try {
    await verifyTrustedOrigin({ allowHostFallback: true })
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      return {
        success: false,
        message: "İstek kaynağı doğrulanamadı. Sayfayı yenileyip yeniden deneyin.",
      }
    }
  }

  const validation = validateBookingForm(values)

  if (!validation.success) {
    return {
      success: false,
      message: "Lütfen formdaki alanları kontrol edin.",
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
      message: "Randevu talebiniz başarıyla alındı.",
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
      message: "Randevu kaydedilirken beklenmeyen bir sorun oluştu.",
    }
  }
}

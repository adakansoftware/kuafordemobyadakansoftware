"use server"

import { AppointmentConflictError, createAppointmentFromWeb } from "@/lib/bookings-repository"
import { validateBookingForm, type BookingFormDraft } from "@/lib/booking"
import { getCurrentRequestId } from "@/lib/http"
import { logEvent } from "@/lib/observability"
import { getRequestIpAddress, RequestSecurityError, verifyTrustedOrigin } from "@/lib/security"

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
  if (values.website?.trim()) {
    logEvent({
      level: "warn",
      event: "booking_action_honeypot_triggered",
      route: "/randevu",
      message: "Booking server action honeypot was filled.",
    })

    return {
      success: false,
      message: "Talebiniz dogrulanamadi. Lutfen formu yeniden deneyin.",
    }
  }

  try {
    await verifyTrustedOrigin({ allowHostFallback: true })
  } catch (error) {
    if (error instanceof RequestSecurityError) {
      logEvent({
        level: "warn",
        event: "booking_action_untrusted_origin",
        route: "/randevu",
        message: error.message,
      })

      return {
        success: false,
        message: "Istek kaynagi dogrulanamadi. Sayfayi yenileyip yeniden deneyin.",
      }
    }
  }

  const validation = validateBookingForm(values)

  if (!validation.success) {
    logEvent({
      level: "warn",
      event: "booking_action_validation_failed",
      route: "/randevu",
      message: "Booking server action validation failed.",
      meta: {
        fieldErrors: validation.errors,
      },
    })

    return {
      success: false,
      message: "Lutfen formdaki alanlari kontrol edin.",
      errors: validation.errors,
    }
  }

  try {
    const result = await createAppointmentFromWeb(validation.data, {
      requestId: await getCurrentRequestId(),
      ipAddress: await getRequestIpAddress(),
    })
    const booking = result.appointment

    logEvent({
      event: result.wasDeduplicated ? "booking_action_replayed" : "booking_action_created",
      route: "/randevu",
      message: result.wasDeduplicated
        ? "Booking server action matched a recent existing appointment."
        : "Booking server action created appointment.",
      meta: {
        bookingId: booking.id,
        service: booking.service.slug,
        date: booking.scheduledDate,
        time: booking.scheduledTime,
        wasDeduplicated: result.wasDeduplicated,
      },
    })

    return {
      success: true,
      bookingId: booking.id,
      serviceTitle: booking.service.title,
      date: booking.scheduledDate,
      time: booking.scheduledTime,
      name: booking.customer.name,
      message: "Randevu talebiniz basariyla alindi.",
    }
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      logEvent({
        level: "warn",
        event: "booking_action_conflict",
        route: "/randevu",
        message: error.message,
        meta: {
          service: validation.data.service,
          date: validation.data.date,
          time: validation.data.time,
        },
      })

      return {
        success: false,
        message: error.message,
      }
    }

    logEvent({
      level: "error",
      event: "booking_action_failed",
      route: "/randevu",
      message: error instanceof Error ? error.message : "Unexpected booking server action error.",
      meta: {
        service: validation.data.service,
        date: validation.data.date,
        time: validation.data.time,
      },
    })

    return {
      success: false,
      message: "Randevu kaydedilirken beklenmeyen bir sorun olustu.",
    }
  }
}

"use server"

import {
  getSubmitBookingRateLimitMessage,
  mapSubmitBookingCreateError,
  mapSubmitBookingSecurityError,
} from "@/lib/booking-action"
import { AppointmentConflictError, createAppointmentFromWeb } from "@/lib/bookings-repository"
import { validateBookingForm, type BookingFormDraft } from "@/lib/booking"
import { getCurrentRequestId } from "@/lib/http"
import { logEvent } from "@/lib/observability"
import { applyRateLimit } from "@/lib/rate-limit"
import { getRequestIpAddress, verifyTrustedOrigin } from "@/lib/security"

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
  const requestId = await getCurrentRequestId()
  const ipAddress = await getRequestIpAddress()

  if (values.website?.trim()) {
    logEvent({
      level: "warn",
      event: "booking_action_honeypot_triggered",
      requestId,
      route: "/randevu",
      message: "Booking server action honeypot was filled.",
      meta: {
        ipAddress,
      },
    })

    return {
      success: false,
      message: "Talebiniz dogrulanamadi. Lutfen formu yeniden deneyin.",
    }
  }

  try {
    await verifyTrustedOrigin({ allowHostFallback: true })
  } catch (error) {
    const securityMessage = mapSubmitBookingSecurityError(error)

    if (securityMessage) {
      logEvent({
        level: "warn",
        event: "booking_action_untrusted_origin",
        requestId,
        route: "/randevu",
        message: error instanceof Error ? error.message : "Booking server action origin verification failed.",
        meta: {
          ipAddress,
        },
      })

      return {
        success: false,
        message: securityMessage,
      }
    }
  }

  const validation = validateBookingForm(values)

  if (!validation.success) {
    logEvent({
      level: "warn",
      event: "booking_action_validation_failed",
      requestId,
      route: "/randevu",
      message: "Booking server action validation failed.",
      meta: {
        ipAddress,
        fieldErrors: validation.errors,
      },
    })

    return {
      success: false,
      message: "Lutfen formdaki alanlari kontrol edin.",
      errors: validation.errors,
    }
  }

  const rateLimit = await applyRateLimit({
    key: ipAddress,
    namespace: "booking-action-write",
    limit: 3,
    windowMs: 60_000,
  })

  if (!rateLimit.allowed) {
    logEvent({
      level: "warn",
      event: "booking_action_rate_limited",
      requestId,
      route: "/randevu",
      message: "Booking server action was rate limited.",
      meta: {
        ipAddress,
        rateLimitSource: rateLimit.source,
      },
    })

    return {
      success: false,
      message: getSubmitBookingRateLimitMessage(),
    }
  }

  try {
    const result = await createAppointmentFromWeb(validation.data, {
      requestId,
      ipAddress,
    })
    const booking = result.appointment

    logEvent({
      event: result.wasDeduplicated ? "booking_action_replayed" : "booking_action_created",
      requestId,
      route: "/randevu",
      message: result.wasDeduplicated
        ? "Booking server action matched a recent existing appointment."
        : "Booking server action created appointment.",
      meta: {
        ipAddress,
        bookingId: booking.id,
        service: booking.service.slug,
        date: booking.scheduledDate,
        time: booking.scheduledTime,
        wasDeduplicated: result.wasDeduplicated,
        rateLimitSource: rateLimit.source,
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
        requestId,
        route: "/randevu",
        message: error.message,
        meta: {
          ipAddress,
          service: validation.data.service,
          date: validation.data.date,
          time: validation.data.time,
        },
      })

      return {
        success: false,
        message: mapSubmitBookingCreateError(error),
      }
    }

    logEvent({
      level: "error",
      event: "booking_action_failed",
      requestId,
      route: "/randevu",
      message: error instanceof Error ? error.message : "Unexpected booking server action error.",
      meta: {
        ipAddress,
        service: validation.data.service,
        date: validation.data.date,
        time: validation.data.time,
      },
    })

    return {
      success: false,
      message: mapSubmitBookingCreateError(error),
    }
  }
}

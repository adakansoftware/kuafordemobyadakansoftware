"use server"

import { headers } from "next/headers"
import {
  getSubmitBookingRateLimitMessage,
  mapSubmitBookingCreateError,
  mapSubmitBookingSecurityError,
} from "@/lib/booking-action"
import { AppointmentConflictError, createAppointmentFromWeb } from "@/lib/bookings-repository"
import { validateBookingForm, type BookingFormDraft } from "@/lib/booking"
import { getCurrentRequestId } from "@/lib/http"
import { logEvent } from "@/lib/observability"
import {
  blockTemporarily,
  buildRequestFingerprint,
  claimReplayWindow,
  getTemporaryBlock,
  recordSuspicion,
  verifyPublicFormChallenge,
  verifyTurnstileToken,
} from "@/lib/request-security"
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
  const requestHeaders = await headers()
  const requestFingerprint = buildRequestFingerprint(requestHeaders, {
    clientFingerprint: values.clientFingerprint?.slice(0, 120) ?? "",
    service: values.service,
    date: values.date,
  })
  const clientKey = `${ipAddress}:${requestFingerprint}`

  const blockState = await getTemporaryBlock("booking-action", clientKey)

  if (blockState && blockState.resetAt > Date.now()) {
    return {
      success: false,
      message: getSubmitBookingRateLimitMessage(),
    }
  }

  if (values.website?.trim()) {
    await recordSuspicion({
      scope: "booking-action",
      clientKey,
      score: 6,
      requestId,
      route: "/randevu",
      reason: "Booking server action honeypot was filled.",
    })
    await blockTemporarily("booking-action", clientKey, 30 * 60_000)

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

  const formChallenge = verifyPublicFormChallenge("booking-form", {
    formIssuedAt: values.formIssuedAt,
    formSignature: values.formSignature,
  })

  if (!formChallenge.ok) {
    const suspicionScore = formChallenge.reason === "form_submitted_too_fast" ? 4 : 3
    const accumulatedScore = await recordSuspicion({
      scope: "booking-action",
      clientKey,
      score: suspicionScore,
      requestId,
      route: "/randevu",
      reason: `Booking form challenge failed: ${formChallenge.reason}.`,
      meta: {
        ageMs: formChallenge.ageMs,
      },
    })

    if (accumulatedScore >= 8) {
      await blockTemporarily("booking-action", clientKey, 30 * 60_000)
    }

    return {
      success: false,
      message: "Talep dogrulamasi basarisiz oldu. Lutfen formu yenileyip tekrar deneyin.",
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

  const turnstileResult = await verifyTurnstileToken({
    token: values.turnstileToken,
    ipAddress,
    requestId,
  })

  if (!turnstileResult.ok) {
    const accumulatedScore = await recordSuspicion({
      scope: "booking-action",
      clientKey,
      score: turnstileResult.enforced ? 5 : 1,
      requestId,
      route: "/randevu",
      reason: `Booking turnstile verification failed: ${turnstileResult.reason}.`,
    })

    if (accumulatedScore >= 8) {
      await blockTemporarily("booking-action", clientKey, 30 * 60_000)
    }

    return {
      success: false,
      message: "Guvenlik dogrulamasi tamamlanamadi. Lutfen tekrar deneyin.",
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
    key: clientKey,
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

  const replayClaim = await claimReplayWindow(
    "booking-action",
    `${clientKey}:${validation.data.service}:${validation.data.date}:${validation.data.time}`,
    2 * 60_000
  )

  if (!replayClaim.ok) {
    await recordSuspicion({
      scope: "booking-action",
      clientKey,
      score: 2,
      requestId,
      route: "/randevu",
      reason: "Booking server action replay window matched an existing recent submission.",
      meta: {
        resetAt: replayClaim.resetAt,
      },
    })
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

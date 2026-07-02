import { NextResponse } from "next/server"
import { validateBookingForm } from "@/lib/booking"
import {
  BOOKING_ROUTE_ALLOW_HEADER,
  MAX_BOOKING_BODY_BYTES,
  getBookingPostGuardFailure,
  getBookingRetryAfterSeconds,
  isValidAvailabilityDate,
  mapBookingCreateError,
} from "@/lib/booking-route"
import { buildRateLimitHeaders, getContentLength, parseBookingPayload, parseJsonText } from "@/lib/bookings-api"
import { AppointmentConflictError, createAppointmentFromWeb, getPublicAvailabilityByDate } from "@/lib/bookings-repository"
import { getRequestIdFromHeaders, jsonNoStore } from "@/lib/http"
import { getDurationMs, logEvent } from "@/lib/observability"
import {
  blockTemporarily,
  buildReplayKey,
  buildRequestFingerprint,
  claimReplayWindow,
  getTemporaryBlock,
  recordSuspicion,
  verifyPublicFormChallenge,
  verifyTurnstileToken,
} from "@/lib/request-security"
import { applyRateLimit } from "@/lib/rate-limit"
import { enterConcurrencyGuard, withTimeout } from "@/lib/resilience"
import { getRequestIpFromHeaders, isTrustedRequestOriginHeaders } from "@/lib/security"

export const dynamic = "force-dynamic"

function jsonResponse(body: unknown, requestId: string, init?: ResponseInit) {
  const response = jsonNoStore(body, { ...init, requestId })
  response.headers.set("Vary", "Origin")
  return response
}

export async function GET(request: Request) {
  const startedAt = Date.now()
  const requestId = getRequestIdFromHeaders(request.headers)
  const clientId = getRequestIpFromHeaders(request.headers)
  const requestFingerprint = buildRequestFingerprint(request.headers, {
    pathname: "/api/bookings",
    method: "GET",
  })
  const clientKey = `${clientId}:${requestFingerprint}`
  const concurrencyLease = enterConcurrencyGuard("api-bookings-get", 40)

  if (!concurrencyLease) {
    return jsonResponse(
      {
        success: false,
        message: "Sistem yogunlugu nedeniyle istek gecici olarak sinirlandi.",
      },
      requestId,
      {
        status: 503,
        headers: {
          "Retry-After": "5",
          "X-Backpressure": "active",
        },
      }
    )
  }

  const rateLimitConfig = {
    limit: 20,
    windowMs: 60_000,
  }

  const rateLimit = await applyRateLimit({
    key: clientKey,
    namespace: "public-bookings-read",
    ...rateLimitConfig,
  })

  try {
    if (!rateLimit.allowed) {
      logEvent({
        level: "warn",
        event: "booking_availability_rate_limited",
        requestId,
        route: "/api/bookings",
        message: "Booking availability request was rate limited.",
        meta: {
          method: "GET",
          clientId,
          rateLimitSource: rateLimit.source,
          responseTimeMs: getDurationMs(startedAt),
        },
      })

      return jsonResponse(
        {
          success: false,
          message: "Kisa sure icinde cok fazla sorgu gonderildi. Lutfen biraz sonra tekrar deneyin.",
        },
        requestId,
        {
          status: 429,
          headers: {
            "Retry-After": getBookingRetryAfterSeconds(rateLimit.resetAt),
            ...buildRateLimitHeaders({ ...rateLimit, limit: rateLimitConfig.limit }),
          },
        }
      )
    }

    const url = new URL(request.url)

    if (url.search.length > 128) {
      return jsonResponse(
        {
          success: false,
          message: "Sorgu parametreleri cok uzun.",
        },
        requestId,
        { status: 414 }
      )
    }

    const rawDate = url.searchParams.get("date")
    const date = rawDate?.trim()

    if (!isValidAvailabilityDate(date)) {
      logEvent({
        level: "warn",
        event: "booking_availability_invalid_date",
        requestId,
        route: "/api/bookings",
        message: "Booking availability request received invalid date.",
        meta: {
          method: "GET",
          clientId,
          date,
          responseTimeMs: getDurationMs(startedAt),
        },
      })

      return jsonResponse(
        {
          success: false,
          message: "Gecerli bir tarih parametresi gonderin.",
        },
        requestId,
        { status: 400 }
      )
    }

    const availability = await withTimeout(
      getPublicAvailabilityByDate(date ?? ""),
      4_000,
      "Booking availability query timed out."
    )

    logEvent({
      event: "booking_availability_served",
      requestId,
      route: "/api/bookings",
      message: "Booking availability response generated.",
      meta: {
        method: "GET",
        clientId,
        date,
        rateLimitSource: rateLimit.source,
        responseTimeMs: getDurationMs(startedAt),
      },
    })

    return jsonResponse(
      {
        success: true,
        data: availability,
      },
      requestId,
      {
        headers: {
          ...(buildRateLimitHeaders({ ...rateLimit, limit: rateLimitConfig.limit }) ?? {}),
          "X-Backpressure": "ok",
        },
      }
    )
  } catch (error) {
    logEvent({
      level: "error",
      event: "booking_availability_failed",
      requestId,
      route: "/api/bookings",
      message: error instanceof Error ? error.message : "Unexpected availability error.",
      meta: {
        method: "GET",
        clientId,
        responseTimeMs: getDurationMs(startedAt),
      },
    })

    return jsonResponse(
      {
        success: false,
        message: "Uygunluk bilgisi alinirken beklenmeyen bir hata olustu.",
      },
      requestId,
      {
        status: 500,
        headers: buildRateLimitHeaders({ ...rateLimit, limit: rateLimitConfig.limit }),
      }
    )
  } finally {
    concurrencyLease.release()
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now()
  const requestId = getRequestIdFromHeaders(request.headers)
  const clientId = getRequestIpFromHeaders(request.headers)
  const requestFingerprint = buildRequestFingerprint(request.headers, {
    pathname: "/api/bookings",
    method: "POST",
  })
  const clientKey = `${clientId}:${requestFingerprint}`
  const concurrencyLease = enterConcurrencyGuard("api-bookings-post", 20)

  if (!concurrencyLease) {
    return jsonResponse(
      {
        success: false,
        message: "Sistem yogunlugu nedeniyle talep gecici olarak kabul edilemiyor.",
      },
      requestId,
      {
        status: 503,
        headers: {
          "Retry-After": "5",
          "X-Backpressure": "active",
        },
      }
    )
  }

  const rateLimitConfig = {
    limit: 3,
    windowMs: 60_000,
  }

  const rateLimit = await applyRateLimit({
    key: clientKey,
    namespace: "public-bookings-write",
    ...rateLimitConfig,
  })

  try {
    const blockState = await getTemporaryBlock("booking-api", clientKey)

    if (blockState && blockState.resetAt > Date.now()) {
      return jsonResponse(
        {
          success: false,
          message: "Kisa sure icinde cok fazla talep gonderildi. Lutfen bir dakika sonra tekrar deneyin.",
        },
        requestId,
        {
          status: 429,
          headers: {
            "Retry-After": getBookingRetryAfterSeconds(blockState.resetAt),
          },
        }
      )
    }

    if (!isTrustedRequestOriginHeaders(request.headers)) {
      logEvent({
        level: "warn",
        event: "booking_create_untrusted_origin",
        requestId,
        route: "/api/bookings",
        message: "Booking create request failed origin verification.",
        meta: {
          method: "POST",
          clientId,
          origin: request.headers.get("origin"),
          host: request.headers.get("host"),
          responseTimeMs: getDurationMs(startedAt),
        },
      })

      await recordSuspicion({
        scope: "booking-api",
        clientKey,
        score: 5,
        requestId,
        route: "/api/bookings",
        reason: "Booking create request failed origin verification.",
      })
      await blockTemporarily("booking-api", clientKey, 15 * 60_000)

      return jsonResponse(
        {
          success: false,
          message: "Istek kaynagi dogrulanamadi.",
        },
        requestId,
        { status: 403 }
      )
    }

    const contentType = request.headers.get("content-type") ?? ""
    const guardFailure = getBookingPostGuardFailure({
      contentType,
      contentLength: getContentLength(request),
    })

    if (guardFailure) {
      return jsonResponse(
        {
          success: false,
          message: guardFailure.message,
        },
        requestId,
        { status: guardFailure.status }
      )
    }

    if (!rateLimit.allowed) {
      logEvent({
        level: "warn",
        event: "booking_create_rate_limited",
        requestId,
        route: "/api/bookings",
        message: "Booking create request was rate limited.",
        meta: {
          method: "POST",
          clientId,
          rateLimitSource: rateLimit.source,
          responseTimeMs: getDurationMs(startedAt),
        },
      })

      return jsonResponse(
        {
          success: false,
          message: "Kisa sure icinde cok fazla talep gonderildi. Lutfen bir dakika sonra tekrar deneyin.",
        },
        requestId,
        {
          status: 429,
          headers: {
            "Retry-After": getBookingRetryAfterSeconds(rateLimit.resetAt),
            ...buildRateLimitHeaders({ ...rateLimit, limit: rateLimitConfig.limit }),
          },
        }
      )
    }

    let rawBody = ""

    try {
      rawBody = await request.text()
    } catch {
      return jsonResponse(
        {
          success: false,
          message: "Istek govdesi okunamadi.",
        },
        requestId,
        { status: 400 }
      )
    }

    if (!rawBody || rawBody.length > MAX_BOOKING_BODY_BYTES) {
      return jsonResponse(
        {
          success: false,
          message: "Istek boyutu siniri asildi.",
        },
        requestId,
        { status: 413 }
      )
    }

    const payload = parseJsonText(rawBody)

    if (!payload) {
      return jsonResponse(
        {
          success: false,
          message: "Istek govdesi okunamadi.",
        },
        requestId,
        { status: 400 }
      )
    }

    const parsedPayload = parseBookingPayload(payload)

    if (!parsedPayload) {
      return jsonResponse(
        {
          success: false,
          message: "Form verisi gecersiz.",
        },
        requestId,
        { status: 400 }
      )
    }

    if (parsedPayload.website?.trim()) {
      await recordSuspicion({
        scope: "booking-api",
        clientKey,
        score: 6,
        requestId,
        route: "/api/bookings",
        reason: "Booking API honeypot was filled.",
      })
      await blockTemporarily("booking-api", clientKey, 30 * 60_000)

      return jsonResponse(
        {
          success: false,
          message: "Talebiniz dogrulanamadi.",
        },
        requestId,
        { status: 400 }
      )
    }

    if (parsedPayload.formIssuedAt || parsedPayload.formSignature) {
      const challenge = verifyPublicFormChallenge("booking-form", {
        formIssuedAt: parsedPayload.formIssuedAt,
        formSignature: parsedPayload.formSignature,
      })

      if (!challenge.ok) {
        const accumulatedScore = await recordSuspicion({
          scope: "booking-api",
          clientKey,
          score: challenge.reason === "form_submitted_too_fast" ? 4 : 3,
          requestId,
          route: "/api/bookings",
          reason: `Booking API form challenge failed: ${challenge.reason}.`,
          meta: {
            ageMs: challenge.ageMs,
          },
        })

        if (accumulatedScore >= 8) {
          await blockTemporarily("booking-api", clientKey, 30 * 60_000)
        }

        return jsonResponse(
          {
            success: false,
            message: "Talep dogrulamasi basarisiz oldu.",
          },
          requestId,
          { status: 400 }
        )
      }
    }

    const turnstileResult = await verifyTurnstileToken({
      token: parsedPayload.turnstileToken,
      ipAddress: clientId,
      requestId,
    })

    if (!turnstileResult.ok) {
      const accumulatedScore = await recordSuspicion({
        scope: "booking-api",
        clientKey,
        score: turnstileResult.enforced ? 5 : 1,
        requestId,
        route: "/api/bookings",
        reason: `Booking API turnstile verification failed: ${turnstileResult.reason}.`,
      })

      if (accumulatedScore >= 8) {
        await blockTemporarily("booking-api", clientKey, 30 * 60_000)
      }

      return jsonResponse(
        {
          success: false,
          message: "Guvenlik dogrulamasi tamamlanamadi.",
        },
        requestId,
        { status: 403 }
      )
    }

    const validation = validateBookingForm(parsedPayload)

    if (!validation.success) {
      logEvent({
        level: "warn",
        event: "booking_create_validation_failed",
        requestId,
        route: "/api/bookings",
        message: "Booking create validation failed.",
        meta: {
          method: "POST",
          clientId,
          fieldErrors: validation.errors,
          responseTimeMs: getDurationMs(startedAt),
        },
      })

      return jsonResponse(
        {
          success: false,
          message: "Form verisi gecersiz.",
          errors: validation.errors,
        },
        requestId,
        { status: 400 }
      )
    }

    const replayClaim = await claimReplayWindow("booking-api", buildReplayKey("booking-api", request.headers, rawBody), 2 * 60_000)

    if (!replayClaim.ok) {
      await recordSuspicion({
        scope: "booking-api",
        clientKey,
        score: 2,
        requestId,
        route: "/api/bookings",
        reason: "Booking API replay window matched a recent submission.",
        meta: {
          resetAt: replayClaim.resetAt,
        },
      })
    }

    try {
      const result = await withTimeout(
        createAppointmentFromWeb(validation.data, {
          requestId,
          ipAddress: clientId,
        }),
        5_000,
        "Booking create transaction timed out."
      )
      const booking = result.appointment

      logEvent({
        event: result.wasDeduplicated ? "booking_create_replayed" : "booking_create_succeeded",
        requestId,
        route: "/api/bookings",
        message: result.wasDeduplicated ? "Booking request matched a recent existing appointment." : "Booking created successfully.",
        meta: {
          method: "POST",
          clientId,
          bookingId: booking.id,
          service: booking.service.slug,
          date: booking.scheduledDate,
          time: booking.scheduledTime,
          wasDeduplicated: result.wasDeduplicated,
          rateLimitSource: rateLimit.source,
          responseTimeMs: getDurationMs(startedAt),
        },
      })

      return jsonResponse(
        {
          success: true,
          data: {
            id: booking.id,
            service: booking.service.title,
            customer: booking.customer.name,
            date: booking.scheduledDate,
            time: booking.scheduledTime,
            status: booking.status,
          },
        },
        requestId,
        {
          status: result.wasDeduplicated ? 200 : 201,
          headers: {
            ...(buildRateLimitHeaders({ ...rateLimit, limit: rateLimitConfig.limit }) ?? {}),
            "X-Backpressure": "ok",
          },
        }
      )
    } catch (error) {
      if (error instanceof AppointmentConflictError) {
        logEvent({
          level: "warn",
          event: "booking_create_conflict",
          requestId,
          route: "/api/bookings",
          message: error.message,
          meta: {
            method: "POST",
            clientId,
            service: validation.data.service,
            date: validation.data.date,
            time: validation.data.time,
            responseTimeMs: getDurationMs(startedAt),
          },
        })

        const mappedError = mapBookingCreateError(error)

        return jsonResponse(
          {
            success: false,
            message: mappedError.message,
          },
          requestId,
          { status: mappedError.status }
        )
      }

      logEvent({
        level: "error",
        event: "booking_create_failed",
        requestId,
        route: "/api/bookings",
        message: error instanceof Error ? error.message : "Unexpected booking create error.",
        meta: {
          method: "POST",
          clientId,
          service: validation.data.service,
          date: validation.data.date,
          time: validation.data.time,
          responseTimeMs: getDurationMs(startedAt),
        },
      })

      const mappedError = mapBookingCreateError(error)

      return jsonResponse(
        {
          success: false,
          message: mappedError.message,
        },
        requestId,
        { status: mappedError.status }
      )
    }
  } finally {
    concurrencyLease.release()
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: BOOKING_ROUTE_ALLOW_HEADER,
      "Cache-Control": "no-store",
      "X-Request-Id": getRequestIdFromHeaders(request.headers),
    },
  })
}

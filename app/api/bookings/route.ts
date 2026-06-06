import { NextResponse } from "next/server"
import { validateBookingForm } from "@/lib/booking"
import { buildRateLimitHeaders, getContentLength, parseBookingPayload, parseJsonText } from "@/lib/bookings-api"
import { AppointmentConflictError, createAppointmentFromWeb, getPublicAvailabilityByDate } from "@/lib/bookings-repository"
import { getRequestIdFromHeaders, jsonNoStore } from "@/lib/http"
import { getDurationMs, logEvent } from "@/lib/observability"
import { applyRateLimit } from "@/lib/rate-limit"
import { getRequestIpFromHeaders, isTrustedRequestOriginHeaders } from "@/lib/security"

export const dynamic = "force-dynamic"

const MAX_BOOKING_BODY_BYTES = 8 * 1024

function jsonResponse(body: unknown, requestId: string, init?: ResponseInit) {
  const response = jsonNoStore(body, { ...init, requestId })
  response.headers.set("Vary", "Origin")
  return response
}

export async function GET(request: Request) {
  const startedAt = Date.now()
  const requestId = getRequestIdFromHeaders(request.headers)
  const clientId = getRequestIpFromHeaders(request.headers)
  const rateLimitConfig = {
    limit: 20,
    windowMs: 60_000,
  }

  const rateLimit = await applyRateLimit({
    key: clientId,
    namespace: "public-bookings-read",
    ...rateLimitConfig,
  })

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
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          ...buildRateLimitHeaders({ ...rateLimit, limit: rateLimitConfig.limit }),
        },
      }
    )
  }

  try {
    const url = new URL(request.url)
    const date = url.searchParams.get("date")?.trim()

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
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

    const availability = await getPublicAvailabilityByDate(date)

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
        headers: buildRateLimitHeaders({ ...rateLimit, limit: rateLimitConfig.limit }),
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
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now()
  const requestId = getRequestIdFromHeaders(request.headers)
  const clientId = getRequestIpFromHeaders(request.headers)

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

  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse(
      {
        success: false,
        message: "Istek bicimi desteklenmiyor.",
      },
      requestId,
      { status: 415 }
    )
  }

  if (getContentLength(request) > MAX_BOOKING_BODY_BYTES) {
    return jsonResponse(
      {
        success: false,
        message: "Istek boyutu siniri asildi.",
      },
      requestId,
      { status: 413 }
    )
  }

  const rateLimitConfig = {
    limit: 3,
    windowMs: 60_000,
  }

  const rateLimit = await applyRateLimit({
    key: clientId,
    namespace: "public-bookings-write",
    ...rateLimitConfig,
  })

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
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
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

  try {
    const result = await createAppointmentFromWeb(validation.data, {
      requestId,
      ipAddress: clientId,
    })
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
        headers: buildRateLimitHeaders({ ...rateLimit, limit: rateLimitConfig.limit }),
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

      return jsonResponse(
        {
          success: false,
          message: error.message,
        },
        requestId,
        { status: 409 }
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

    return jsonResponse(
      {
        success: false,
        message: "Randevu kaydi sirasinda beklenmeyen bir hata olustu.",
      },
      requestId,
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, OPTIONS",
      "Cache-Control": "no-store",
      "X-Request-Id": getRequestIdFromHeaders(request.headers),
    },
  })
}

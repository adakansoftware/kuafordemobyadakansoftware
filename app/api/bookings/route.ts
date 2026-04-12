import { NextResponse } from "next/server"
import { AppointmentConflictError, createAppointmentFromWeb, getPublicAvailabilityByDate } from "@/lib/bookings-repository"
import { type BookingFormDraft, validateBookingForm } from "@/lib/booking"
import { applyRateLimit } from "@/lib/rate-limit"
import { getRequestIpFromHeaders, isTrustedRequestOriginHeaders } from "@/lib/security"

export const dynamic = "force-dynamic"

const MAX_BOOKING_BODY_BYTES = 8 * 1024

function jsonResponse(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("X-Robots-Tag", "noindex, nofollow")
  response.headers.set("Vary", "Origin")
  return response
}

function parseBookingPayload(payload: unknown): BookingFormDraft | null {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const candidate = payload as Partial<Record<keyof BookingFormDraft, unknown>>

  if (
    typeof candidate.service !== "string" ||
    typeof candidate.date !== "string" ||
    typeof candidate.time !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.phone !== "string" ||
    typeof candidate.email !== "string"
  ) {
    return null
  }

  return {
    service: candidate.service,
    date: candidate.date,
    time: candidate.time,
    name: candidate.name,
    phone: candidate.phone,
    email: candidate.email,
    website: typeof candidate.website === "string" ? candidate.website : "",
  }
}

function getContentLength(request: Request) {
  const raw = request.headers.get("content-length")
  const parsed = raw ? Number(raw) : 0
  return Number.isFinite(parsed) ? parsed : 0
}

function parseJsonText(text: string) {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const clientId = getRequestIpFromHeaders(request.headers)
  const rateLimit = await applyRateLimit({
    key: clientId,
    namespace: "public-bookings-read",
    limit: 20,
    windowMs: 60_000,
  })

  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        success: false,
        message: "Kısa süre içinde çok fazla sorgu gönderildi. Lütfen biraz sonra tekrar deneyin.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    )
  }

  const url = new URL(request.url)
  const date = url.searchParams.get("date")?.trim()

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return jsonResponse(
      {
        success: false,
        message: "Geçerli bir tarih parametresi gönderin.",
      },
      { status: 400 }
    )
  }

  const availability = await getPublicAvailabilityByDate(date)

  return jsonResponse({
    success: true,
    data: availability,
  })
}

export async function POST(request: Request) {
  if (!isTrustedRequestOriginHeaders(request.headers)) {
    return jsonResponse(
      {
        success: false,
        message: "İstek kaynağı doğrulanamadı.",
      },
      { status: 403 }
    )
  }

  const contentType = request.headers.get("content-type") ?? ""

  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse(
      {
        success: false,
        message: "İstek biçimi desteklenmiyor.",
      },
      { status: 415 }
    )
  }

  if (getContentLength(request) > MAX_BOOKING_BODY_BYTES) {
    return jsonResponse(
      {
        success: false,
        message: "İstek boyutu sınırı aşıldı.",
      },
      { status: 413 }
    )
  }

  const clientId = getRequestIpFromHeaders(request.headers)
  const rateLimit = await applyRateLimit({
    key: clientId,
    namespace: "public-bookings-write",
    limit: 3,
    windowMs: 60_000,
  })

  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        success: false,
        message: "Kısa süre içinde çok fazla talep gönderildi. Lütfen bir dakika sonra tekrar deneyin.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
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
        message: "İstek gövdesi okunamadı.",
      },
      { status: 400 }
    )
  }

  if (!rawBody || rawBody.length > MAX_BOOKING_BODY_BYTES) {
    return jsonResponse(
      {
        success: false,
        message: "İstek boyutu sınırı aşıldı.",
      },
      { status: 413 }
    )
  }

  const payload = parseJsonText(rawBody)

  if (!payload) {
    return jsonResponse(
      {
        success: false,
        message: "İstek gövdesi okunamadı.",
      },
      { status: 400 }
    )
  }

  const parsedPayload = parseBookingPayload(payload)

  if (!parsedPayload) {
    return jsonResponse(
      {
        success: false,
        message: "Form verisi geçersiz.",
      },
      { status: 400 }
    )
  }

  const validation = validateBookingForm(parsedPayload)

  if (!validation.success) {
    return jsonResponse(
      {
        success: false,
        message: "Form verisi geçersiz.",
        errors: validation.errors,
      },
      { status: 400 }
    )
  }

  try {
    const booking = await createAppointmentFromWeb(validation.data)

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
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return jsonResponse(
        {
          success: false,
          message: error.message,
        },
        { status: 409 }
      )
    }

    return jsonResponse(
      {
        success: false,
        message: "Randevu kaydı sırasında beklenmeyen bir hata oluştu.",
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, OPTIONS",
      "Cache-Control": "no-store",
    },
  })
}

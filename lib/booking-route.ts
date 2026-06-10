export const MAX_BOOKING_BODY_BYTES = 8 * 1024

export function isValidAvailabilityDate(date: string | null | undefined) {
  return Boolean(date && /^\d{4}-\d{2}-\d{2}$/.test(date.trim()))
}

export function getBookingRetryAfterSeconds(resetAt: number, now = Date.now()) {
  return String(Math.ceil((resetAt - now) / 1000))
}

export function getBookingPostGuardFailure(input: {
  contentType: string | null | undefined
  contentLength: number
  maxBytes?: number
}) {
  const maxBytes = input.maxBytes ?? MAX_BOOKING_BODY_BYTES
  const contentType = input.contentType ?? ""

  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      status: 415,
      message: "Istek bicimi desteklenmiyor.",
    }
  }

  if (input.contentLength > maxBytes) {
    return {
      status: 413,
      message: "Istek boyutu siniri asildi.",
    }
  }

  return null
}

export function mapBookingCreateError(error: unknown) {
  if (error instanceof Error && error.name === "AppointmentConflictError") {
    return {
      status: 409,
      message: error.message,
    }
  }

  return {
    status: 500,
    message: "Randevu kaydi sirasinda beklenmeyen bir hata olustu.",
  }
}

import { bookingActionMessages, type Locale } from "./i18n/validation.ts"

export function mapSubmitBookingSecurityError(error: unknown, locale: Locale = "tr") {
  if (error instanceof Error && error.name === "RequestSecurityError") {
    return bookingActionMessages[locale].securityError
  }

  return null
}

export function getSubmitBookingRateLimitMessage(locale: Locale = "tr") {
  return bookingActionMessages[locale].rateLimited
}

export function mapSubmitBookingCreateError(error: unknown, locale: Locale = "tr") {
  if (error instanceof Error && error.name === "CustomerIdentityConflictError") {
    return error.message
  }

  if (error instanceof Error && error.name === "AppointmentConflictError") {
    return error.message
  }

  return bookingActionMessages[locale].createFailed
}

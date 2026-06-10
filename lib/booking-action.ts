export function mapSubmitBookingSecurityError(error: unknown) {
  if (error instanceof Error && error.name === "RequestSecurityError") {
    return "Istek kaynagi dogrulanamadi. Sayfayi yenileyip yeniden deneyin."
  }

  return null
}

export function getSubmitBookingRateLimitMessage() {
  return "Kisa sure icinde cok fazla talep gonderildi. Lutfen bir dakika sonra tekrar deneyin."
}

export function mapSubmitBookingCreateError(error: unknown) {
  if (error instanceof Error && error.name === "AppointmentConflictError") {
    return error.message
  }

  return "Randevu kaydedilirken beklenmeyen bir sorun olustu."
}

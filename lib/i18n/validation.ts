export type Locale = "tr" | "en"

export const locales: Locale[] = ["tr", "en"]

export function normalizeLocale(value: string | undefined | null): Locale {
  return value === "en" ? "en" : "tr"
}

export type BookingValidationMessages = {
  serviceRequired: string
  serviceInvalid: string
  dateRequired: string
  dateInvalid: string
  timeRequired: string
  nameTooShort: string
  nameTooLong: string
  nameInvalidChars: string
  phoneTooShort: string
  phoneTooLong: string
  emailInvalid: string
  dateInPast: string
  timeTooSoon: string
}

const trMessages: BookingValidationMessages = {
  serviceRequired: "Lütfen bir hizmet seçin.",
  serviceInvalid: "Geçerli bir hizmet seçin.",
  dateRequired: "Lütfen bir tarih seçin.",
  dateInvalid: "Geçerli bir tarih seçin.",
  timeRequired: "Lütfen bir saat seçin.",
  nameTooShort: "Ad soyad en az 3 karakter olmalı.",
  nameTooLong: "Ad soyad çok uzun.",
  nameInvalidChars: "Ad soyad alanında yalnızca harf kullanın.",
  phoneTooShort: "Telefon numarası eksik görünüyor.",
  phoneTooLong: "Telefon numarası çok uzun.",
  emailInvalid: "Geçerli bir e-posta girin.",
  dateInPast: "Geçmiş bir tarih seçemezsiniz.",
  timeTooSoon: "Yaklaşan 30 dakika içindeki saatler için online talep alınmıyor. Lütfen daha ileri bir saat seçin.",
}

const enMessages: BookingValidationMessages = {
  serviceRequired: "Please select a service.",
  serviceInvalid: "Please select a valid service.",
  dateRequired: "Please select a date.",
  dateInvalid: "Please select a valid date.",
  timeRequired: "Please select a time.",
  nameTooShort: "Full name must be at least 3 characters.",
  nameTooLong: "Full name is too long.",
  nameInvalidChars: "Use only letters in the full name field.",
  phoneTooShort: "The phone number looks incomplete.",
  phoneTooLong: "The phone number is too long.",
  emailInvalid: "Please enter a valid email address.",
  dateInPast: "You cannot select a date in the past.",
  timeTooSoon: "Online requests are not accepted for times within the next 30 minutes. Please choose a later time.",
}

export const bookingValidationMessages: Record<Locale, BookingValidationMessages> = {
  tr: trMessages,
  en: enMessages,
}

export type BookingActionMessages = {
  securityError: string
  rateLimited: string
  createFailed: string
  honeypot: string
  challengeFailed: string
  turnstileFailed: string
  checkFields: string
  success: string
}

export const bookingActionMessages: Record<Locale, BookingActionMessages> = {
  tr: {
    securityError: "İstek kaynağı doğrulanamadı. Sayfayı yenileyip yeniden deneyin.",
    rateLimited: "Kısa süre içinde çok fazla talep gönderildi. Lütfen bir dakika sonra tekrar deneyin.",
    createFailed: "Randevu kaydedilirken beklenmeyen bir sorun oluştu.",
    honeypot: "Talebiniz doğrulanamadı. Lütfen formu yeniden deneyin.",
    challengeFailed: "Talep doğrulaması başarısız oldu. Lütfen formu yenileyip tekrar deneyin.",
    turnstileFailed: "Güvenlik doğrulaması tamamlanamadı. Lütfen tekrar deneyin.",
    checkFields: "Lütfen formdaki alanları kontrol edin.",
    success: "Randevu talebiniz başarıyla alındı.",
  },
  en: {
    securityError: "The request origin could not be verified. Refresh the page and try again.",
    rateLimited: "Too many requests were sent in a short time. Please try again in a minute.",
    createFailed: "An unexpected problem occurred while saving the appointment.",
    honeypot: "Your request could not be verified. Please try the form again.",
    challengeFailed: "Request verification failed. Please refresh the form and try again.",
    turnstileFailed: "Security verification could not be completed. Please try again.",
    checkFields: "Please check the fields in the form.",
    success: "Your appointment request has been received successfully.",
  },
}

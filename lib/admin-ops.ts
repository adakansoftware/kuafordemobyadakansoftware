import { PaymentMethod } from "@prisma/client"
import { z } from "zod"

export const paymentSchema = z.object({
  appointmentId: z.string().trim().min(1, "Randevu kaydi bulunamadi."),
  amount: z.coerce.number().int().positive("Odeme tutari sifirdan buyuk olmalidir."),
  method: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: "Gecerli bir odeme yontemi secin." }),
  }),
  note: z.string().trim().max(500, "Odeme notu en fazla 500 karakter olabilir.").optional().default(""),
})

export const businessSettingsSchema = z.object({
  businessName: z.string().trim().min(2, "Salon adi gereklidir."),
  tagline: z.string().trim().min(2, "Kisa aciklama gereklidir."),
  phone: z.string().trim().min(10, "Telefon bilgisi eksik gorunuyor."),
  whatsappPhone: z.string().trim().min(10, "WhatsApp numarasi eksik gorunuyor."),
  email: z.string().trim().email("Gecerli bir e-posta girin."),
  address: z.string().trim().min(5, "Adres gereklidir."),
  city: z.string().trim().min(2, "Sehir bilgisi gereklidir."),
  currency: z.string().trim().min(3, "Para birimi gereklidir.").max(6, "Para birimi cok uzun."),
  dailyCapacity: z.coerce.number().int().min(1, "Gunluk kapasite en az 1 olmalidir.").max(500, "Gunluk kapasite cok yuksek."),
  workingHoursNote: z.string().trim().max(1000, "Calisma saatleri notu en fazla 1000 karakter olabilir.").optional().default(""),
})

export const customerNotesSchema = z.object({
  customerId: z.string().trim().min(1, "Musteri kaydi bulunamadi."),
  notes: z.string().trim().max(1000, "Musteri notu en fazla 1000 karakter olabilir.").default(""),
})

export function mapAdminPaymentError(error: unknown) {
  if (error instanceof Error && error.name === "AdminPaymentError") {
    return error.message
  }

  return "Odeme kaydi sirasinda beklenmeyen bir hata olustu."
}

export function mapBusinessSettingsError() {
  return "Isletme ayarlari guncellenirken beklenmeyen bir hata olustu."
}

export function mapCustomerNotesError() {
  return "Musteri notu guncellenirken beklenmeyen bir hata olustu."
}

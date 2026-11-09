import { PaymentMethod } from "@prisma/client"
import { z } from "zod"

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number)
  return hours * 60 + minutes
}

export const paymentSchema = z.object({
  appointmentId: z.string().trim().min(1, "Randevu kaydı bulunamadı."),
  amount: z.coerce.number().int().positive("Ödeme tutarı sıfırdan büyük olmalıdır."),
  method: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: "Geçerli bir ödeme yöntemi seçin." }),
  }),
  note: z.string().trim().max(500, "Ödeme notu en fazla 500 karakter olabilir.").optional().default(""),
})

export const businessSettingsSchema = z.object({
  businessName: z.string().trim().min(2, "Salon adı gereklidir."),
  tagline: z.string().trim().min(2, "Kısa açıklama gereklidir."),
  phone: z.string().trim().min(10, "Telefon bilgisi eksik görünüyor."),
  whatsappPhone: z.string().trim().min(10, "WhatsApp numarası eksik görünüyor."),
  email: z.string().trim().email("Geçerli bir e-posta girin."),
  address: z.string().trim().min(5, "Adres gereklidir."),
  city: z.string().trim().min(2, "Şehir bilgisi gereklidir."),
  currency: z.string().trim().min(3, "Para birimi gereklidir.").max(6, "Para birimi çok uzun."),
  dailyCapacity: z.coerce.number().int().min(1, "Günlük kapasite en az 1 olmalıdır.").max(500, "Günlük kapasite çok yüksek."),
  workingHoursNote: z.string().trim().max(1000, "Çalışma saatleri notu en fazla 1000 karakter olabilir.").optional().default(""),
})

export const customerNotesSchema = z.object({
  customerId: z.string().trim().min(1, "Müşteri kaydı bulunamadı."),
  notes: z.string().trim().max(1000, "Müşteri notu en fazla 1000 karakter olabilir.").default(""),
})

export const staffAvailabilitySchema = z.object({
  staffId: z.string().trim().min(1, "Personel kaydı bulunamadı."),
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  startTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "Başlangıç saati geçersiz."),
  endTime: z.string().trim().regex(/^\d{2}:\d{2}$/, "Bitiş saati geçersiz."),
  breakStartTime: z.string().trim().optional().default(""),
  breakEndTime: z.string().trim().optional().default(""),
}).superRefine((value, context) => {
  if (timeToMinutes(value.startTime) >= timeToMinutes(value.endTime)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "Bitiş saati başlangıç saatinden sonra olmalıdır.",
    })
  }

  const hasBreakStart = Boolean(value.breakStartTime)
  const hasBreakEnd = Boolean(value.breakEndTime)

  if (hasBreakStart !== hasBreakEnd) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["breakStartTime"],
      message: "Mola saatleri birlikte girilmelidir.",
    })
    return
  }

  if (!hasBreakStart || !hasBreakEnd) {
    return
  }

  if (!/^\d{2}:\d{2}$/.test(value.breakStartTime) || !/^\d{2}:\d{2}$/.test(value.breakEndTime)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["breakStartTime"],
      message: "Mola saatleri HH:MM formatında olmalıdır.",
    })
    return
  }

  const startMinutes = timeToMinutes(value.startTime)
  const endMinutes = timeToMinutes(value.endTime)
  const breakStartMinutes = timeToMinutes(value.breakStartTime)
  const breakEndMinutes = timeToMinutes(value.breakEndTime)

  if (breakStartMinutes >= breakEndMinutes) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["breakEndTime"],
      message: "Mola bitişi mola başlangıcından sonra olmalıdır.",
    })
  }

  if (breakStartMinutes <= startMinutes || breakEndMinutes >= endMinutes) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["breakStartTime"],
      message: "Mola saatleri mesai aralığı içinde kalmalıdır.",
    })
  }
})

export const staffTimeOffSchema = z.object({
  staffId: z.string().trim().min(1, "Personel kaydı bulunamadı."),
  startDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Başlangıç tarihi geçersiz."),
  endDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Bitiş tarihi geçersiz."),
  isAllDay: z.union([z.literal("true"), z.literal("false"), z.boolean()]).optional().default("true"),
  startTime: z.string().trim().optional().default(""),
  endTime: z.string().trim().optional().default(""),
  reason: z.string().trim().max(500, "İzin nedeni en fazla 500 karakter olabilir.").optional().default(""),
}).superRefine((value, context) => {
  if (value.startDate > value.endDate) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
    })
  }

  const isAllDay = value.isAllDay === true || value.isAllDay === "true"
  const hasStartTime = Boolean(value.startTime)
  const hasEndTime = Boolean(value.endTime)

  if (isAllDay) {
    return
  }

  if (!hasStartTime || !hasEndTime) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startTime"],
      message: "Saat bazlı izin için başlangıç ve bitiş saati birlikte girilmelidir.",
    })
    return
  }

  if (!/^\d{2}:\d{2}$/.test(value.startTime) || !/^\d{2}:\d{2}$/.test(value.endTime)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["startTime"],
      message: "İzin saatleri HH:MM formatında olmalıdır.",
    })
    return
  }

  if (timeToMinutes(value.startTime) >= timeToMinutes(value.endTime)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endTime"],
      message: "İzin bitiş saati başlangıç saatinden sonra olmalıdır.",
    })
  }
})

export const productSaleSchema = z.object({
  productId: z.string().trim().min(1, "Ürün seçilmelidir."),
  quantity: z.coerce.number().int().min(1, "Adet en az 1 olmalıdır."),
  customerId: z.string().trim().optional().default(""),
  staffId: z.string().trim().optional().default(""),
  method: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: "Geçerli bir ödeme yöntemi seçin." }),
  }),
  note: z.string().trim().max(500, "Satış notu en fazla 500 karakter olabilir.").optional().default(""),
})

export function mapAdminPaymentError(
  error: unknown,
  messages: { unexpected: string } = { unexpected: "Ödeme kaydı sırasında beklenmeyen bir hata oluştu." }
) {
  if (error instanceof Error && error.name === "AdminPaymentError") {
    return error.message
  }

  return messages.unexpected
}

export function mapBusinessSettingsError(
  messages: { unexpected: string } = { unexpected: "İşletme ayarları güncellenirken beklenmeyen bir hata oluştu." }
) {
  return messages.unexpected
}

export function mapCustomerNotesError(
  messages: { unexpected: string } = { unexpected: "Müşteri notu güncellenirken beklenmeyen bir hata oluştu." }
) {
  return messages.unexpected
}

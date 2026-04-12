"use server"

import { AppointmentStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { AppointmentConflictError, updateAppointmentFromAdmin } from "@/lib/bookings-repository"
import { adminNotesSchema } from "@/lib/booking"
import { AdminAccessError, requireAdminAccess, RequestSecurityError, verifyTrustedOrigin } from "@/lib/security"

export type UpdateAppointmentActionState = {
  success: boolean
  message: string
  appointmentId?: string
}

const validStatuses = new Set<AppointmentStatus>([
  AppointmentStatus.NEW,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
])

export async function updateAppointmentAction(
  _previousState: UpdateAppointmentActionState,
  formData: FormData
): Promise<UpdateAppointmentActionState> {
  try {
    await requireAdminAccess()
    await verifyTrustedOrigin({ allowHostFallback: true })
  } catch (error) {
    const message =
      error instanceof AdminAccessError
        ? "Bu işlem için yönetim erişimi doğrulanamadı."
        : error instanceof RequestSecurityError
          ? "İstek kaynağı doğrulanamadı."
          : "Güvenlik doğrulaması başarısız oldu."

    return {
      success: false,
      message,
    }
  }

  const appointmentId = String(formData.get("appointmentId") ?? "").trim()
  const statusValue = String(formData.get("status") ?? "").trim()
  const staffId = String(formData.get("staffId") ?? "").trim()
  const notes = String(formData.get("notes") ?? "").trim()

  if (!appointmentId) {
    return {
      success: false,
      message: "Randevu kaydı bulunamadı.",
    }
  }

  if (!validStatuses.has(statusValue as AppointmentStatus)) {
    return {
      success: false,
      message: "Geçersiz durum seçildi.",
      appointmentId,
    }
  }

  const validatedNotes = adminNotesSchema.safeParse(notes)

  if (!validatedNotes.success) {
    return {
      success: false,
      message: validatedNotes.error.issues[0]?.message ?? "Operasyon notu geçersiz.",
      appointmentId,
    }
  }

  try {
    await updateAppointmentFromAdmin({
      appointmentId,
      status: statusValue as AppointmentStatus,
      staffId: staffId || null,
      notes: validatedNotes.data,
    })

    revalidatePath("/admin")
    revalidatePath("/randevu")

    return {
      success: true,
      message: "Randevu kaydı güncellendi.",
      appointmentId,
    }
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return {
        success: false,
        message: error.message,
        appointmentId,
      }
    }

    return {
      success: false,
      message: "Güncelleme sırasında beklenmeyen bir hata oluştu.",
      appointmentId,
    }
  }
}

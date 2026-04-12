"use server"

import { AppointmentStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { AppointmentConflictError, updateAppointmentFromAdmin } from "@/lib/bookings-repository"

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
  const appointmentId = String(formData.get("appointmentId") ?? "").trim()
  const statusValue = String(formData.get("status") ?? "").trim()
  const staffId = String(formData.get("staffId") ?? "").trim()
  const notes = String(formData.get("notes") ?? "").trim()

  if (!appointmentId) {
    return {
      success: false,
      message: "Randevu kaydi bulunamadi.",
    }
  }

  if (!validStatuses.has(statusValue as AppointmentStatus)) {
    return {
      success: false,
      message: "Gecersiz durum secildi.",
      appointmentId,
    }
  }

  try {
    await updateAppointmentFromAdmin({
      appointmentId,
      status: statusValue as AppointmentStatus,
      staffId: staffId || null,
      notes,
    })

    revalidatePath("/admin")
    revalidatePath("/randevu")

    return {
      success: true,
      message: "Randevu kaydi guncellendi.",
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
      message: "Guncelleme sirasinda beklenmeyen bir hata olustu.",
      appointmentId,
    }
  }
}

"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { completeSetupWizard } from "@/lib/salon-ops-repository"
import { buildSetupServices, buildSetupStaffMembers } from "@/lib/setup-wizard"

const setupSchema = z.object({
  tenantName: z.string().trim().min(2, "Salon adi en az 2 karakter olmalidir."),
  phone: z.string().trim().min(10, "Telefon bilgisi en az 10 karakter olmalidir."),
  ownerUsername: z.string().trim().min(3, "Kurucu kullanici adi en az 3 karakter olmalidir."),
  ownerEmail: z.string().trim().email("Gecerli bir e-posta adresi girin."),
  ownerPassword: z.string().trim().min(12, "Kurucu sifresi en az 12 karakter olmalidir."),
  staffNames: z.string().trim().min(2, "En az bir personel girilmelidir."),
  serviceTitles: z.string().trim().min(2, "En az bir hizmet girilmelidir."),
})

export type SetupWizardState = {
  success: boolean
  message: string
}

export async function completeSetupWizardAction(
  _previousState: SetupWizardState,
  formData: FormData
): Promise<SetupWizardState> {
  const validation = setupSchema.safeParse({
    tenantName: formData.get("tenantName"),
    phone: formData.get("phone"),
    ownerUsername: formData.get("ownerUsername"),
    ownerEmail: formData.get("ownerEmail"),
    ownerPassword: formData.get("ownerPassword"),
    staffNames: formData.get("staffNames"),
    serviceTitles: formData.get("serviceTitles"),
  })

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Kurulum formu gecersiz.",
    }
  }

  const staffMembers = buildSetupStaffMembers(validation.data.staffNames)
  const services = buildSetupServices(validation.data.serviceTitles)

  if (staffMembers.length === 0) {
    return {
      success: false,
      message: "Kurulum icin en az bir benzersiz personel girilmelidir.",
    }
  }

  if (services.length === 0) {
    return {
      success: false,
      message: "Kurulum icin en az bir benzersiz hizmet girilmelidir.",
    }
  }

  try {
    await completeSetupWizard({
      tenantName: validation.data.tenantName,
      phone: validation.data.phone,
      ownerUsername: validation.data.ownerUsername,
      ownerEmail: validation.data.ownerEmail,
      ownerPassword: validation.data.ownerPassword,
      staffMembers,
      services,
    })

    revalidatePath("/admin")
    revalidatePath("/setup")

    return {
      success: true,
      message: "Kurulum tamamlandi. Salon artik production modunda.",
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Kurulum tamamlanamadi.",
    }
  }
}

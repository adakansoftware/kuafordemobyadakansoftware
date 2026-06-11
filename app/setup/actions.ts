"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { completeSetupWizard } from "@/lib/salon-ops-repository"

const setupSchema = z.object({
  tenantName: z.string().trim().min(2),
  phone: z.string().trim().min(10),
  ownerUsername: z.string().trim().min(3),
  ownerEmail: z.string().trim().email(),
  ownerPassword: z.string().trim().min(8),
  staffNames: z.string().trim().min(2),
  serviceTitles: z.string().trim().min(2),
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

  const staffMembers = validation.data.staffNames
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((name) => ({ name, role: "Stilist" }))

  const services = validation.data.serviceTitles
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((title, index) => ({
      slug: `setup-service-${index + 1}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title,
      shortTitle: title,
      teaser: `${title} hizmeti kurulum sihirbazi ile olusturuldu.`,
      description: `${title} hizmeti tenant kurulumu sirasinda otomatik tanimlandi.`,
      durationMinutes: 60,
      priceFrom: 1000 + index * 250,
    }))

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

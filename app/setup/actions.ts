"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { getOptionalEnv } from "@/lib/env"
import { getCurrentRequestId } from "@/lib/http"
import { logEvent } from "@/lib/observability"
import { blockTemporarily, getTemporaryBlock, recordSuspicion, verifyPublicFormChallenge } from "@/lib/request-security"
import { applyRateLimit } from "@/lib/rate-limit"
import { getRequestIpAddress, verifyTrustedOrigin } from "@/lib/security"
import { completeSetupWizard } from "@/lib/salon-ops-repository"
import { buildSetupServices, buildSetupStaffMembers } from "@/lib/setup-wizard"

const setupSchema = z.object({
  tenantName: z.string().trim().min(2, "Salon adi en az 2 karakter olmalidir."),
  phone: z.string().trim().min(10, "Telefon bilgisi en az 10 karakter olmalidir."),
  ownerUsername: z.string().trim().min(3, "Kurucu kullanici adi en az 3 karakter olmalidir."),
  ownerEmail: z.string().trim().email("Gecerli bir e-posta adresi girin."),
  ownerPassword: z.string().trim().min(12, "Kurucu sifresi en az 12 karakter olmalidir."),
  setupAccessToken: z.string().trim().min(1, "Kurulum erisim tokeni gereklidir."),
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
  const requestId = await getCurrentRequestId()
  const ipAddress = await getRequestIpAddress()
  let clientKey = ipAddress

  try {
    await verifyTrustedOrigin({ allowHostFallback: true })
  } catch (error) {
    logEvent({
      level: "warn",
      event: "setup_origin_rejected",
      requestId,
      route: "/setup",
      message: error instanceof Error ? error.message : "Setup origin verification failed.",
      meta: {
        ipAddress,
      },
    })

    return {
      success: false,
      message: "Kurulum istegi dogrulanamadi.",
    }
  }

  const challenge = verifyPublicFormChallenge("setup-form", {
    formIssuedAt: String(formData.get("formIssuedAt") ?? ""),
    formSignature: String(formData.get("formSignature") ?? ""),
  })

  if (!challenge.ok) {
    return {
      success: false,
      message: "Kurulum formu dogrulamasi basarisiz oldu.",
    }
  }

  if (String(formData.get("website") ?? "").trim()) {
    return {
      success: false,
      message: "Kurulum istegi reddedildi.",
    }
  }

  const validation = setupSchema.safeParse({
    tenantName: formData.get("tenantName"),
    phone: formData.get("phone"),
    ownerUsername: formData.get("ownerUsername"),
    ownerEmail: formData.get("ownerEmail"),
    ownerPassword: formData.get("ownerPassword"),
    setupAccessToken: formData.get("setupAccessToken"),
    staffNames: formData.get("staffNames"),
    serviceTitles: formData.get("serviceTitles"),
  })

  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message ?? "Kurulum formu gecersiz.",
    }
  }

  clientKey = `${ipAddress}:${validation.data.ownerUsername.toLowerCase()}:${validation.data.ownerEmail.toLowerCase()}`

  const blockState = await getTemporaryBlock("setup", clientKey)

  if (blockState && blockState.resetAt > Date.now()) {
    return {
      success: false,
      message: "Cok fazla kurulum denemesi yapildi. Lutfen daha sonra tekrar deneyin.",
    }
  }

  const rateLimit = await applyRateLimit({
    key: clientKey,
    namespace: "setup-write",
    limit: 3,
    windowMs: 30 * 60_000,
  })

  if (!rateLimit.allowed) {
    await blockTemporarily("setup", clientKey, 60 * 60_000)
    return {
      success: false,
      message: "Cok fazla kurulum denemesi yapildi. Lutfen daha sonra tekrar deneyin.",
    }
  }

  const existingSetup = await db.tenant.findFirst({
    where: {
      isSetupComplete: true,
      isActive: true,
    },
    select: {
      id: true,
    },
  })

  if (existingSetup) {
    await recordSuspicion({
      scope: "setup",
      clientKey,
      score: 6,
      requestId,
      route: "/setup",
      reason: "Setup was attempted after initial bootstrap had already completed.",
      audit: true,
    })

    return {
      success: false,
      message: "Kurulum daha once tamamlanmis.",
    }
  }

  const env = getOptionalEnv()
  const expectedToken = env.SETUP_ACCESS_TOKEN?.trim()

  if (!expectedToken || validation.data.setupAccessToken !== expectedToken) {
    const accumulatedScore = await recordSuspicion({
      scope: "setup",
      clientKey,
      score: 5,
      requestId,
      route: "/setup",
      reason: "Setup access token validation failed.",
      audit: true,
    })

    if (accumulatedScore >= 8) {
      await blockTemporarily("setup", clientKey, 60 * 60_000)
    }

    return {
      success: false,
      message: "Kurulum erisim tokeni gecersiz.",
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
    logEvent({
      level: "error",
      event: "setup_failed",
      requestId,
      route: "/setup",
      message: error instanceof Error ? error.message : "Setup failed.",
      meta: {
        ipAddress,
      },
    })

    return {
      success: false,
      message: error instanceof Error ? error.message : "Kurulum tamamlanamadi.",
    }
  }
}

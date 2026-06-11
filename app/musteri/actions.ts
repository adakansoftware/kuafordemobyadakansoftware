"use server"

import { cookies } from "next/headers"
import { beginCustomerPortalAccess, getCustomerPortalSnapshot, requestAppointmentCancellation, verifyCustomerPortalAccess } from "@/lib/salon-ops-repository"

export type CustomerPortalState = {
  step: "request" | "verify" | "ready"
  success: boolean
  message: string
  tokenId?: string
  mockCode?: string
  customerId?: string
}

export async function requestCustomerPortalCodeAction(
  _previousState: CustomerPortalState,
  formData: FormData
): Promise<CustomerPortalState> {
  try {
    const result = await beginCustomerPortalAccess({
      identifier: String(formData.get("identifier") ?? ""),
    })

    return {
      step: "verify",
      success: true,
      message: "Mock OTP olusturuldu. Demo kod ekranda gosteriliyor.",
      tokenId: result.tokenId,
      mockCode: result.mockCode,
      customerId: result.customerId,
    }
  } catch (error) {
    return {
      step: "request",
      success: false,
      message: error instanceof Error ? error.message : "Kod olusturulamadi.",
    }
  }
}

export async function verifyCustomerPortalCodeAction(
  previousState: CustomerPortalState,
  formData: FormData
): Promise<CustomerPortalState> {
  try {
    const result = await verifyCustomerPortalAccess({
      tokenId: String(formData.get("tokenId") ?? previousState.tokenId ?? ""),
      code: String(formData.get("code") ?? ""),
    })

    ;(await cookies()).set("customer_portal_customer_id", result.customerId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/musteri",
    })

    return {
      step: "ready",
      success: true,
      message: "Musteri paneli acildi.",
      customerId: result.customerId,
    }
  } catch (error) {
    return {
      ...previousState,
      step: "verify",
      success: false,
      message: error instanceof Error ? error.message : "Kod dogrulanamadi.",
    }
  }
}

export async function requestCancellationAction(appointmentId: string, reason: string) {
  const customerId = (await cookies()).get("customer_portal_customer_id")?.value

  if (!customerId) {
    throw new Error("Musteri oturumu bulunamadi.")
  }

  return requestAppointmentCancellation({
    appointmentId,
    customerId,
    reason,
  })
}

export async function getCustomerPortalSessionSnapshot() {
  const customerId = (await cookies()).get("customer_portal_customer_id")?.value

  if (!customerId) {
    return null
  }

  return getCustomerPortalSnapshot({ customerId })
}

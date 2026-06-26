"use server"

import { cookies } from "next/headers"
import { getCurrentRequestId } from "@/lib/http"
import { logEvent } from "@/lib/observability"
import { applyRateLimit } from "@/lib/rate-limit"
import { getCustomerPortalSessionMaxAgeSeconds } from "@/lib/customer-portal"
import { getRequestIpAddress, verifyTrustedOrigin } from "@/lib/security"
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
  const requestId = await getCurrentRequestId()
  const ipAddress = await getRequestIpAddress()
  const identifier = String(formData.get("identifier") ?? "")

  try {
    await verifyTrustedOrigin({ allowHostFallback: true })
    const rateLimit = await applyRateLimit({
      key: `${ipAddress}:${identifier.trim().toLowerCase() || "anonymous"}`,
      namespace: "customer-portal-request",
      limit: 6,
      windowMs: 10 * 60_000,
    })

    if (!rateLimit.allowed) {
      return {
        step: "request",
        success: false,
        message: "Cok fazla kod denemesi yapildi. Lutfen biraz sonra tekrar deneyin.",
      }
    }

    const result = await beginCustomerPortalAccess({
      identifier,
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
    logEvent({
      level: "warn",
      event: "customer_portal_code_request_failed",
      requestId,
      route: "/musteri",
      message: error instanceof Error ? error.message : "Customer portal code request failed.",
      meta: {
        ipAddress,
      },
    })

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
  const requestId = await getCurrentRequestId()
  const ipAddress = await getRequestIpAddress()
  const tokenId = String(formData.get("tokenId") ?? previousState.tokenId ?? "")

  try {
    await verifyTrustedOrigin({ allowHostFallback: true })
    const rateLimit = await applyRateLimit({
      key: `${ipAddress}:${tokenId || "unknown-token"}`,
      namespace: "customer-portal-verify",
      limit: 10,
      windowMs: 10 * 60_000,
    })

    if (!rateLimit.allowed) {
      return {
        ...previousState,
        step: "verify",
        success: false,
        message: "Cok fazla dogrulama denemesi yapildi. Lutfen biraz sonra tekrar deneyin.",
      }
    }

    const result = await verifyCustomerPortalAccess({
      tokenId,
      code: String(formData.get("code") ?? ""),
    })

    ;(await cookies()).set("customer_portal_customer_id", result.customerId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/musteri",
      secure: process.env.NODE_ENV === "production",
      maxAge: getCustomerPortalSessionMaxAgeSeconds(),
    })

    return {
      step: "ready",
      success: true,
      message: "Musteri paneli acildi.",
      customerId: result.customerId,
    }
  } catch (error) {
    logEvent({
      level: "warn",
      event: "customer_portal_verify_failed",
      requestId,
      route: "/musteri",
      message: error instanceof Error ? error.message : "Customer portal verification failed.",
      meta: {
        ipAddress,
      },
    })

    return {
      ...previousState,
      step: "verify",
      success: false,
      message: error instanceof Error ? error.message : "Kod dogrulanamadi.",
    }
  }
}

export async function requestCancellationAction(appointmentId: string, reason: string) {
  const requestId = await getCurrentRequestId()
  const ipAddress = await getRequestIpAddress()
  const customerId = (await cookies()).get("customer_portal_customer_id")?.value

  if (!customerId) {
    throw new Error("Musteri oturumu bulunamadi.")
  }

  await verifyTrustedOrigin({ allowHostFallback: true })
  const rateLimit = await applyRateLimit({
    key: `${ipAddress}:${customerId}`,
    namespace: "customer-portal-cancellation",
    limit: 8,
    windowMs: 10 * 60_000,
  })

  if (!rateLimit.allowed) {
    throw new Error("Cok fazla iptal talebi gonderildi. Lutfen biraz sonra tekrar deneyin.")
  }

  try {
    return await requestAppointmentCancellation({
      appointmentId,
      customerId,
      reason,
    })
  } catch (error) {
    logEvent({
      level: "warn",
      event: "customer_portal_cancellation_failed",
      requestId,
      route: "/musteri",
      message: error instanceof Error ? error.message : "Customer portal cancellation request failed.",
      meta: {
        ipAddress,
        appointmentId,
        customerId,
      },
    })

    throw error
  }
}

export async function getCustomerPortalSessionSnapshot() {
  const customerId = (await cookies()).get("customer_portal_customer_id")?.value

  if (!customerId) {
    return null
  }

  return getCustomerPortalSnapshot({ customerId })
}

"use server"

import { cookies, headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { upsertNotificationPreference } from "@/lib/notifications/notification-service"
import { getCurrentRequestId } from "@/lib/http"
import { logEvent } from "@/lib/observability"
import {
  claimReplayWindow,
  blockTemporarily,
  buildRequestFingerprint,
  getTemporaryBlock,
  recordSuspicion,
  verifyPublicFormChallenge,
} from "@/lib/request-security"
import { applyRateLimit } from "@/lib/rate-limit"
import {
  CUSTOMER_PORTAL_SESSION_COOKIE_NAME,
  createCustomerPortalSessionValue,
  getCustomerPortalSessionMaxAgeSeconds,
  parseCustomerPortalSessionValue,
  registerCustomerPortalSession,
  revokeCustomerPortalSession,
  resolveCustomerPortalSession,
} from "@/lib/customer-portal"
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
  const requestHeaders = await headers()
  const fingerprint = buildRequestFingerprint(requestHeaders, {
    route: "/musteri",
    identifier: identifier.trim().toLowerCase().slice(0, 80),
  })
  const clientKey = `${ipAddress}:${fingerprint}`

  try {
    await verifyTrustedOrigin({ allowHostFallback: true })

    if (String(formData.get("website") ?? "").trim()) {
      await recordSuspicion({
        scope: "customer-portal-request",
        clientKey,
        score: 6,
        requestId,
        route: "/musteri",
        reason: "Customer portal request honeypot was filled.",
      })
      await blockTemporarily("customer-portal-request", clientKey, 30 * 60_000)

      return {
        step: "request",
        success: false,
        message: "Istek dogrulanamadi.",
      }
    }

    const blockState = await getTemporaryBlock("customer-portal-request", clientKey)

    if (blockState && blockState.resetAt > Date.now()) {
      return {
        step: "request",
        success: false,
        message: "Cok fazla kod denemesi yapildi. Lutfen biraz sonra tekrar deneyin.",
      }
    }

    const challenge = verifyPublicFormChallenge("customer-portal-request", {
      formIssuedAt: String(formData.get("formIssuedAt") ?? ""),
      formSignature: String(formData.get("formSignature") ?? ""),
    })

    if (!challenge.ok) {
      const accumulatedScore = await recordSuspicion({
        scope: "customer-portal-request",
        clientKey,
        score: challenge.reason === "form_submitted_too_fast" ? 4 : 3,
        requestId,
        route: "/musteri",
        reason: `Customer portal request challenge failed: ${challenge.reason}.`,
      })

      if (accumulatedScore >= 8) {
        await blockTemporarily("customer-portal-request", clientKey, 30 * 60_000)
      }

      return {
        step: "request",
        success: false,
        message: "Istek dogrulanamadi.",
      }
    }

    const rateLimit = await applyRateLimit({
      key: `${clientKey}:${identifier.trim().toLowerCase() || "anonymous"}`,
      namespace: "customer-portal-request",
      limit: 6,
      windowMs: 10 * 60_000,
    })

    if (!rateLimit.allowed) {
      await blockTemporarily("customer-portal-request", clientKey, 30 * 60_000)
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
      message:
        process.env.NODE_ENV === "production"
          ? "Bilgi mevcutsa dogrulama kodu hazirlandi. Kodu girerek devam edin."
          : "Mock OTP olusturuldu. Demo kod ekranda gosteriliyor.",
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
      message:
        process.env.NODE_ENV === "production"
          ? "Kod istegi su anda tamamlanamadi."
          : error instanceof Error
            ? error.message
            : "Kod olusturulamadi.",
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
  const requestHeaders = await headers()
  const fingerprint = buildRequestFingerprint(requestHeaders, {
    route: "/musteri",
    tokenId: tokenId.slice(0, 80),
  })
  const clientKey = `${ipAddress}:${fingerprint}`

  try {
    await verifyTrustedOrigin({ allowHostFallback: true })

    if (String(formData.get("website") ?? "").trim()) {
      await recordSuspicion({
        scope: "customer-portal-verify",
        clientKey,
        score: 6,
        requestId,
        route: "/musteri",
        reason: "Customer portal verify honeypot was filled.",
      })
      await blockTemporarily("customer-portal-verify", clientKey, 30 * 60_000)

      return {
        ...previousState,
        step: "verify",
        success: false,
        message: "Kod dogrulanamadi.",
      }
    }

    const rateLimit = await applyRateLimit({
      key: `${clientKey}:${tokenId || "unknown-token"}`,
      namespace: "customer-portal-verify",
      limit: 10,
      windowMs: 10 * 60_000,
    })

    if (!rateLimit.allowed) {
      await blockTemporarily("customer-portal-verify", clientKey, 30 * 60_000)
      return {
        ...previousState,
        step: "verify",
        success: false,
        message: "Cok fazla dogrulama denemesi yapildi. Lutfen biraz sonra tekrar deneyin.",
      }
    }

    const blockState = await getTemporaryBlock("customer-portal-verify", clientKey)

    if (blockState && blockState.resetAt > Date.now()) {
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
    const sessionFingerprint = `${requestHeaders.get("user-agent")?.slice(0, 120) ?? ""}|${requestHeaders.get("accept-language")?.slice(0, 40) ?? ""}`
    const expiresAt = Date.now() + getCustomerPortalSessionMaxAgeSeconds() * 1000
    const existingSession = await resolveCustomerPortalSession({
      value: (await cookies()).get(CUSTOMER_PORTAL_SESSION_COOKIE_NAME)?.value,
      fingerprint: sessionFingerprint,
    })
    const sessionValue = createCustomerPortalSessionValue({
      customerId: result.customerId,
      fingerprint: sessionFingerprint,
      expiresAt,
    })
    const parsed = parseCustomerPortalSessionValue(sessionValue, sessionFingerprint)

    if (!parsed?.sessionId) {
      throw new Error("Musteri oturumu olusturulamadi.")
    }

    await registerCustomerPortalSession({
      customerId: result.customerId,
      sessionId: parsed.sessionId,
      expiresAt,
    })

    await revokeCustomerPortalSession(existingSession?.sessionId)

    ;(await cookies()).set(CUSTOMER_PORTAL_SESSION_COOKIE_NAME, sessionValue, {
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
    await recordSuspicion({
      scope: "customer-portal-verify",
      clientKey,
      score: 2,
      requestId,
      route: "/musteri",
      reason: error instanceof Error ? error.message : "Customer portal verification failed.",
    })

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
      message:
        process.env.NODE_ENV === "production"
          ? "Kod dogrulanamadi."
          : error instanceof Error
            ? error.message
            : "Kod dogrulanamadi.",
    }
  }
}

export async function requestCancellationAction(appointmentId: string, reason: string) {
  const requestId = await getCurrentRequestId()
  const ipAddress = await getRequestIpAddress()
  const requestHeaders = await headers()
  const fingerprint = `${requestHeaders.get("user-agent")?.slice(0, 120) ?? ""}|${requestHeaders.get("accept-language")?.slice(0, 40) ?? ""}`
  const customerSession = await resolveCustomerPortalSession({
    value: (await cookies()).get(CUSTOMER_PORTAL_SESSION_COOKIE_NAME)?.value,
    fingerprint,
  })
  const customerId = customerSession?.customerId

  if (!customerId) {
    ;(await cookies()).set(CUSTOMER_PORTAL_SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/musteri",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      maxAge: 0,
    })
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

  const replayClaim = await claimReplayWindow(
    "customer-portal-cancellation",
    `${customerId}:${appointmentId}:${reason.trim().slice(0, 120)}`,
    2 * 60_000
  )

  if (!replayClaim.ok) {
    throw new Error("Bu iptal talebi zaten isleme alindi. Lutfen tekrar denemeden once bekleyin.")
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
  const requestHeaders = await headers()
  const fingerprint = `${requestHeaders.get("user-agent")?.slice(0, 120) ?? ""}|${requestHeaders.get("accept-language")?.slice(0, 40) ?? ""}`
  const cookieStore = await cookies()
  const staleSessionValue = cookieStore.get(CUSTOMER_PORTAL_SESSION_COOKIE_NAME)?.value
  const customerSession = await resolveCustomerPortalSession({
    value: staleSessionValue,
    fingerprint,
  })
  const customerId = customerSession?.customerId

  if (!customerId) {
    if (staleSessionValue) {
      try {
        cookieStore.set(CUSTOMER_PORTAL_SESSION_COOKIE_NAME, "", {
          httpOnly: true,
          sameSite: "lax",
          path: "/musteri",
          secure: process.env.NODE_ENV === "production",
          expires: new Date(0),
          maxAge: 0,
        })
      } catch {
        // Cookie clearing is only possible in a Server Action or Route Handler.
        // Stale cookies fall through here; login/logout actions clear them.
      }
    }
    return null
  }

  return getCustomerPortalSnapshot({ customerId })
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const requestHeaders = await headers()
  const fingerprint = `${requestHeaders.get("user-agent")?.slice(0, 120) ?? ""}|${requestHeaders.get("accept-language")?.slice(0, 40) ?? ""}`
  const cookieStore = await cookies()
  const session = await resolveCustomerPortalSession({
    value: cookieStore.get(CUSTOMER_PORTAL_SESSION_COOKIE_NAME)?.value,
    fingerprint,
  })

  if (!session?.customerId) {
    return
  }

  const customer = await db.customer.findFirst({
    where: { id: session.customerId },
    select: { tenantId: true, email: true, phone: true },
  })

  if (!customer) {
    return
  }

  const emailOptIn = String(formData.get("emailOptIn") ?? "") === "true" && Boolean(customer.email)
  const smsOptIn = String(formData.get("smsOptIn") ?? "") === "true" && Boolean(customer.phone)

  await upsertNotificationPreference({
    tenantId: customer.tenantId,
    customerId: session.customerId,
    emailOptIn,
    smsOptIn,
  })

  revalidatePath("/musteri")
}

export async function customerPortalLogoutAction() {
  const requestHeaders = await headers()
  const fingerprint = `${requestHeaders.get("user-agent")?.slice(0, 120) ?? ""}|${requestHeaders.get("accept-language")?.slice(0, 40) ?? ""}`
  const cookieStore = await cookies()
  const session = await resolveCustomerPortalSession({
    value: cookieStore.get(CUSTOMER_PORTAL_SESSION_COOKIE_NAME)?.value,
    fingerprint,
  })

  await revokeCustomerPortalSession(session?.sessionId)
  cookieStore.set(CUSTOMER_PORTAL_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/musteri",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    maxAge: 0,
  })
}

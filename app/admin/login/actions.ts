"use server"

import { redirect } from "next/navigation"
import { createAdminSession, setAdminSessionCookie } from "@/lib/admin-session"
import { decryptAdminMfaSecret, verifyTotpCodeDetailed } from "@/lib/admin-mfa"
import { db } from "@/lib/db"
import { getCurrentRequestId } from "@/lib/http"
import { logEvent } from "@/lib/observability"
import { verifyPassword } from "@/lib/password"
import { applyRateLimit, claimRateLimitWindow } from "@/lib/rate-limit"
import { blockTemporarily, getTemporaryBlock, recordSuspicion, verifyPublicFormChallenge } from "@/lib/request-security"
import { getRequestIpAddress, verifyTrustedOrigin } from "@/lib/security"
import { getTenantContextBySlugOrDefault, getTenantRequestCandidate } from "@/lib/tenant"

export type AdminLoginState = {
  success: boolean
  message: string
}

export async function adminLoginAction(
  _previousState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const requestId = await getCurrentRequestId()
  const ipAddress = await getRequestIpAddress()

  try {
    await verifyTrustedOrigin({ allowHostFallback: true })
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Giris istegi dogrulanamadi.",
    }
  }

  const username = String(formData.get("username") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const totpCode = String(formData.get("totpCode") ?? "")
  const clientKey = `${ipAddress}:${username.toLowerCase() || "anonymous"}`

  if (String(formData.get("website") ?? "").trim()) {
    await recordSuspicion({
      scope: "admin-login",
      clientKey,
      score: 6,
      requestId,
      route: "/admin/login",
      reason: "Admin login honeypot was filled.",
      audit: true,
    })
    await blockTemporarily("admin-login", clientKey, 30 * 60_000)

    return {
      success: false,
      message: "Giris istegi dogrulanamadi.",
    }
  }

  const blockState = await getTemporaryBlock("admin-login", clientKey)

  if (blockState && blockState.resetAt > Date.now()) {
    return {
      success: false,
      message: "Cok fazla giris denemesi yapildi. Lutfen biraz sonra tekrar deneyin.",
    }
  }

  const challenge = verifyPublicFormChallenge("admin-login-form", {
    formIssuedAt: String(formData.get("formIssuedAt") ?? ""),
    formSignature: String(formData.get("formSignature") ?? ""),
  })

  if (!challenge.ok) {
    const accumulatedScore = await recordSuspicion({
      scope: "admin-login",
      clientKey,
      score: challenge.reason === "form_submitted_too_fast" ? 4 : 3,
      requestId,
      route: "/admin/login",
      reason: `Admin login challenge failed: ${challenge.reason}.`,
      audit: true,
    })

    if (accumulatedScore >= 8) {
      await blockTemporarily("admin-login", clientKey, 30 * 60_000)
    }

    return {
      success: false,
      message: "Giris istegi dogrulanamadi.",
    }
  }

  if (!username || !password) {
    return {
      success: false,
      message: "Kullanici adi ve sifre gereklidir.",
    }
  }

  const tenant = await getTenantContextBySlugOrDefault(await getTenantRequestCandidate())
  const rateLimit = await applyRateLimit({
    key: `${tenant.tenantId}:${ipAddress}:${username.toLowerCase()}`,
    namespace: "admin-login-write",
    limit: 6,
    windowMs: 10 * 60_000,
  })

  if (!rateLimit.allowed) {
    await blockTemporarily("admin-login", clientKey, 30 * 60_000)
    return {
      success: false,
      message: "Cok fazla giris denemesi yapildi. Lutfen biraz sonra tekrar deneyin.",
    }
  }

  const adminUser = await db.adminUser.findFirst({
    where: {
      tenantId: tenant.tenantId,
      username,
      isActive: true,
    },
    select: {
      id: true,
      username: true,
      passwordHash: true,
      tenantId: true,
      mfaSecretCiphertext: true,
      mfaEnabledAt: true,
    },
  })

  if (!adminUser || !verifyPassword(password, adminUser.passwordHash)) {
    await recordSuspicion({
      scope: "admin-login",
      clientKey,
      score: 2,
      requestId,
      route: "/admin/login",
      reason: "Admin login credentials were invalid.",
      audit: true,
    })

    logEvent({
      level: "warn",
      event: "admin_login_failed",
      requestId,
      route: "/admin/login",
      message: "Admin login failed.",
      meta: {
        ipAddress,
        username,
      },
    })

    return {
      success: false,
      message: "Kullanici adi veya sifre gecersiz.",
    }
  }

  if (adminUser.mfaEnabledAt && adminUser.mfaSecretCiphertext) {
    const secret = decryptAdminMfaSecret(adminUser.mfaSecretCiphertext)
    const verifiedCode = verifyTotpCodeDetailed({ secret, code: totpCode })

    if (!verifiedCode) {
      await recordSuspicion({
        scope: "admin-login",
        clientKey,
        score: 4,
        requestId,
        route: "/admin/login",
        reason: "Admin login MFA verification failed.",
        audit: true,
      })

      logEvent({
        level: "warn",
        event: "admin_login_mfa_failed",
        requestId,
        route: "/admin/login",
        message: "Admin login MFA verification failed.",
        meta: {
          ipAddress,
          username,
        },
      })

      return {
        success: false,
        message: "Authenticator kodu gecersiz.",
      }
    }

    const codeClaim = await claimRateLimitWindow({
      namespace: "admin-mfa-login",
      key: `${adminUser.id}:${verifiedCode.counter}`,
      windowMs: 2 * 60_000,
    })

    if (!codeClaim.ok) {
      await recordSuspicion({
        scope: "admin-login",
        clientKey,
        score: 3,
        requestId,
        route: "/admin/login",
        reason: "Admin login MFA code replay was detected.",
        audit: true,
      })

      return {
        success: false,
        message: "Bu authenticator kodu daha once kullanildi. Yeni kod bekleyin.",
      }
    }
  }

  const session = await createAdminSession({
    tenantId: adminUser.tenantId,
    adminUserId: adminUser.id,
  })

  await setAdminSessionCookie(session.token, session.expiresAt)
  await db.adminUser.update({
    where: { id: adminUser.id },
    data: {
      lastLoginAt: new Date(),
    },
  })

  redirect("/admin/dashboard")
}

export async function adminLogoutAction() {
  const { clearAdminSessionCookie, revokeAdminSession, ADMIN_SESSION_COOKIE_NAME } = await import("@/lib/admin-session")
  const { cookies } = await import("next/headers")
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE_NAME)?.value ?? null

  await revokeAdminSession(token)
  await clearAdminSessionCookie()
  redirect("/admin/login")
}

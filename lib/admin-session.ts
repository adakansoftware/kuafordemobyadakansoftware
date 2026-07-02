import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import { cookies, headers } from "next/headers"
import type { AdminUserRole } from "@prisma/client"
import { db } from "./db.ts"
import { getOptionalEnv } from "./env.ts"
import { logEvent } from "./observability.ts"
import { verifyPassword } from "./password.ts"
import { getRequestIpFromHeaders } from "./security-core.ts"

export const ADMIN_SESSION_COOKIE_NAME = "admin_session"
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12
const ADMIN_SESSION_ROTATE_AFTER_MS = 1000 * 60 * 30
const ADMIN_STEP_UP_MAX_AGE_MS = 1000 * 60 * 10

export class AdminStepUpError extends Error {
  constructor(message = "Kritik islem icin yonetici sifresi ile ek dogrulama gereklidir.") {
    super(message)
    this.name = "AdminStepUpError"
  }
}

type SessionBinding = {
  userAgentHash: string
  acceptLanguageHash: string
  ipContextHash: string
}

function getSessionSecret() {
  return getOptionalEnv().APP_SECURITY_SECRET?.trim() || "development-admin-session-secret"
}

function hashValue(value: string) {
  return createHash("sha256").update(`${getSessionSecret()}:${value}`).digest("hex")
}

function normalizeIpContext(ipAddress: string) {
  const trimmed = ipAddress.trim()

  if (!trimmed || trimmed === "unknown") {
    return "unknown"
  }

  if (trimmed.includes(".")) {
    const parts = trimmed.split(".")
    return parts.slice(0, 3).join(".")
  }

  return trimmed.split(":").slice(0, 4).join(":")
}

function getSessionBindingFromRequestHeaders(requestHeaders: Headers) {
  const ipAddress = getRequestIpFromHeaders(requestHeaders)
  return {
    userAgentHash: hashValue(requestHeaders.get("user-agent")?.slice(0, 200) ?? ""),
    acceptLanguageHash: hashValue(requestHeaders.get("accept-language")?.slice(0, 80) ?? ""),
    ipContextHash: hashValue(normalizeIpContext(ipAddress)),
  } satisfies SessionBinding
}

async function getSessionBindingFromHeaders() {
  return getSessionBindingFromRequestHeaders(await headers())
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

function buildSessionTokenHash(token: string) {
  return hashValue(token)
}

export async function createAdminSession(input: {
  tenantId: string
  adminUserId: string
}) {
  const binding = await getSessionBindingFromHeaders()
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000)

  await db.adminSession.create({
    data: {
      tenantId: input.tenantId,
      adminUserId: input.adminUserId,
      tokenHash: buildSessionTokenHash(token),
      userAgentHash: binding.userAgentHash,
      acceptLanguageHash: binding.acceptLanguageHash,
      ipContextHash: binding.ipContextHash,
      expiresAt,
      stepUpVerifiedAt: new Date(),
    },
  })

  return {
    token,
    expiresAt,
  }
}

export async function setAdminSessionCookie(token: string, expiresAt: Date) {
  try {
    ;(await cookies()).set(ADMIN_SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/admin",
      expires: expiresAt,
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    })
  } catch {
    // Rendering contexts may not allow cookie mutation; ignore and keep request auth path intact.
  }
}

export async function clearAdminSessionCookie() {
  try {
    ;(await cookies()).set(ADMIN_SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/admin",
      expires: new Date(0),
      maxAge: 0,
    })
  } catch {
    // no-op
  }
}

export async function revokeAdminSession(token: string | null | undefined) {
  if (!token?.trim()) {
    return
  }

  await db.adminSession.updateMany({
    where: {
      tokenHash: buildSessionTokenHash(token.trim()),
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })
}

export async function resolveAdminSession() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE_NAME)?.value?.trim()

  if (!token) {
    return null
  }

  return resolveAdminSessionFromRequest({
    token,
    requestHeaders: await headers(),
    rotateCookie: true,
  })
}

export async function resolveAdminSessionFromRequest(input: {
  token: string
  requestHeaders: Headers
  rotateCookie?: boolean
}) {
  const binding = getSessionBindingFromRequestHeaders(input.requestHeaders)
  const session = await db.adminSession.findFirst({
    where: {
      tokenHash: buildSessionTokenHash(input.token),
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      adminUser: {
        select: {
          id: true,
          username: true,
          role: true,
          staffId: true,
          isActive: true,
          tenantId: true,
        },
      },
      tenant: {
        select: {
          slug: true,
        },
      },
    },
  })

  if (!session || !session.adminUser.isActive) {
    await clearAdminSessionCookie()
    return null
  }

  const isBindingMatch =
    constantTimeEqual(session.userAgentHash, binding.userAgentHash) &&
    constantTimeEqual(session.acceptLanguageHash, binding.acceptLanguageHash) &&
    constantTimeEqual(session.ipContextHash, binding.ipContextHash)

  if (!isBindingMatch) {
    await db.adminSession.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    })

    await clearAdminSessionCookie()

    logEvent({
      level: "warn",
      event: "admin_session_binding_failed",
      route: "/admin",
      message: "Admin session binding verification failed.",
      meta: {
        sessionId: session.id,
        adminUserId: session.adminUserId,
      },
    })

    return null
  }

  const now = Date.now()
  const shouldRotate = Boolean(input.rotateCookie) && now - session.lastSeenAt.getTime() > ADMIN_SESSION_ROTATE_AFTER_MS
  let nextToken: string | null = null
  let nextExpiresAt: Date | null = null

  if (shouldRotate) {
    nextToken = randomBytes(32).toString("base64url")
    nextExpiresAt = new Date(now + ADMIN_SESSION_MAX_AGE_SECONDS * 1000)

    await db.adminSession.update({
      where: { id: session.id },
      data: {
        tokenHash: buildSessionTokenHash(nextToken),
        lastSeenAt: new Date(),
        expiresAt: nextExpiresAt,
      },
    })
  } else {
    await db.adminSession.update({
      where: { id: session.id },
      data: {
        lastSeenAt: new Date(),
      },
    })
  }

  if (nextToken && nextExpiresAt) {
    if (input.rotateCookie) {
      await setAdminSessionCookie(nextToken, nextExpiresAt)
    }
  }

  return {
    sessionId: session.id,
    stepUpVerifiedAt: session.stepUpVerifiedAt,
    tenantId: session.tenantId,
    tenantSlug: session.tenant.slug,
    actorIdentifier: session.adminUser.username,
    role: session.adminUser.role as AdminUserRole,
    staffId: session.adminUser.staffId,
    source: "admin_session" as const,
  }
}

export async function requireAdminSessionStepUp(input: {
  sessionId: string
  password?: string | null
  maxAgeMs?: number
}) {
  const session = await db.adminSession.findFirst({
    where: {
      id: input.sessionId,
      revokedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      stepUpVerifiedAt: true,
      adminUser: {
        select: {
          passwordHash: true,
        },
      },
    },
  })

  if (!session) {
    throw new AdminStepUpError("Admin oturumu gecersiz veya suresi dolmus.")
  }

  const maxAgeMs = input.maxAgeMs ?? ADMIN_STEP_UP_MAX_AGE_MS

  if (session.stepUpVerifiedAt && Date.now() - session.stepUpVerifiedAt.getTime() <= maxAgeMs) {
    return
  }

  const password = input.password?.trim()

  if (!password) {
    throw new AdminStepUpError()
  }

  if (!verifyPassword(password, session.adminUser.passwordHash)) {
    throw new AdminStepUpError("Yonetici sifresi dogrulanamadi.")
  }

  await db.adminSession.update({
    where: { id: session.id },
    data: {
      stepUpVerifiedAt: new Date(),
    },
  })
}

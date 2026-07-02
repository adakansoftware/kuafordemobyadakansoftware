import { headers } from "next/headers"
import { AdminUserRole } from "@prisma/client"
import type { AdminAccessContext } from "./admin-access.ts"
import { hasRequiredRole } from "./admin-access.ts"
import { db } from "./db.ts"
import { getEnv } from "./env.ts"
import { verifyPassword } from "./password.ts"
import {
  authorizeAdminRequest,
  getAdminAllowlistIps,
  getBasicAuthUsername,
  getBasicAuthPassword,
  getAllowedHosts,
  getAllowedOrigins,
  isIpAllowed,
  getRequestIpFromHeaders,
  isTrustedRequestOriginHeaders,
  normalizeHost,
  normalizeOrigin,
} from "./security-core.ts"
import { DEFAULT_TENANT_SLUG, getTenantContextBySlugOrDefault, getTenantRequestCandidate } from "./tenant.ts"

const ADMIN_REALM = "Adakan Admin"

export {
  authorizeAdminRequest,
  getAdminAllowlistIps,
  getBasicAuthUsername,
  getAllowedHosts,
  getAllowedOrigins,
  getRequestIpFromHeaders,
  isIpAllowed,
  isTrustedRequestOriginHeaders,
  normalizeHost,
  normalizeOrigin,
}

export class AdminAccessError extends Error {
  constructor(message = "Yonetim alanina erisim izni bulunamadi.") {
    super(message)
    this.name = "AdminAccessError"
  }
}

export class AuthorizationError extends Error {
  constructor(message = "Bu islem icin yetkiniz bulunmuyor.") {
    super(message)
    this.name = "AuthorizationError"
  }
}

export class RequestSecurityError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RequestSecurityError"
  }
}

export function getAdminBasicAuthHeader() {
  return `Basic realm="${ADMIN_REALM}", charset="UTF-8"`
}

export function getSecurityHeaders() {
  const allowedOrigins = Array.from(getAllowedOrigins())
  const connectSources = ["'self'", ...allowedOrigins]

  return [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "img-src 'self' data: blob:",
        "font-src 'self' https://fonts.gstatic.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "script-src 'self' 'unsafe-inline'",
        `connect-src ${connectSources.join(" ")}`,
        "frame-src 'self' https://www.google.com https://www.google.com.tr",
      ].join("; "),
    },
  ]
}

export async function requireAdminAccess(): Promise<AdminAccessContext> {
  const env = getEnv()
  const requestHeaders = await headers()
  const ipAddress = getRequestIpFromHeaders(requestHeaders)
  const allowlist = getAdminAllowlistIps()
  const authorization = requestHeaders.get("authorization")
  const username = getBasicAuthUsername(authorization)
  const password = getBasicAuthPassword(authorization)
  const tenantSlug = await getTenantRequestCandidate()
  const tenant = await getTenantContextBySlugOrDefault(tenantSlug)

  if (!isIpAllowed(ipAddress, allowlist)) {
    throw new AdminAccessError("Bu IP adresi admin erisimi icin izinli degil.")
  }

  if (username && password) {
    const adminUser = await db.adminUser.findFirst({
      where: {
        tenantId: tenant.tenantId,
        username,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        role: true,
        staffId: true,
        passwordHash: true,
        tenantId: true,
      },
    })

    if (adminUser && verifyPassword(password, adminUser.passwordHash)) {
      await db.adminUser.update({
        where: { id: adminUser.id },
        data: {
          lastLoginAt: new Date(),
        },
      })

      return {
        tenantId: adminUser.tenantId,
        tenantSlug: tenant.tenantSlug,
        actorIdentifier: adminUser.username,
        role: adminUser.role,
        staffId: adminUser.staffId,
        source: "admin_user",
      }
    }
  }

  if (!env.ADMIN_USERNAME?.trim() || !env.ADMIN_PASSWORD?.trim()) {
    throw new AdminAccessError("Admin erisimi icin ortam degiskenleri eksik.")
  }

  if (!authorizeAdminRequest(requestHeaders.get("authorization"))) {
    throw new AdminAccessError()
  }

  return {
    tenantId: tenant.tenantId,
    tenantSlug: tenant.tenantSlug,
    actorIdentifier: env.ADMIN_USERNAME ?? "admin",
    role: AdminUserRole.OWNER,
    staffId: null,
    source: "basic_auth_fallback",
  }
}

export async function verifyTrustedOrigin(options: { allowHostFallback?: boolean } = {}) {
  const requestHeaders = await headers()

  if (!isTrustedRequestOriginHeaders(requestHeaders, options)) {
    throw new RequestSecurityError("Istek kaynagi dogrulanamadi.")
  }
}

export async function getAdminActorIdentifier() {
  const context = await requireAdminAccess()
  return context.actorIdentifier
}

export async function getRequestIpAddress() {
  const requestHeaders = await headers()
  return getRequestIpFromHeaders(requestHeaders)
}

export async function requireAdminRoles(allowedRoles: AdminUserRole[]) {
  const context = await requireAdminAccess()

  if (!hasRequiredRole(context.role, allowedRoles)) {
    throw new AuthorizationError()
  }

  return context
}

export async function getCurrentTenantContext() {
  return getTenantContextBySlugOrDefault(await getTenantRequestCandidate())
}

export function getDefaultTenantSlug() {
  return DEFAULT_TENANT_SLUG
}

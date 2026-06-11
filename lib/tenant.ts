import { headers as nextHeaders } from "next/headers"
import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import {
  DEFAULT_TENANT_SLUG,
  filterRecordsByTenantId,
  isCrossTenantAccess,
  normalizeTenantSlug,
  resolveTenantSlugFromHost,
} from "@/lib/tenant-core"

export type TenantContext = {
  tenantId: string
  tenantSlug: string
  tenantName: string
  mode: "DEMO" | "PRODUCTION"
}

export { DEFAULT_TENANT_SLUG, filterRecordsByTenantId, isCrossTenantAccess, normalizeTenantSlug, resolveTenantSlugFromHost }

export async function getTenantRequestCandidate() {
  const requestHeaders = await nextHeaders()
  const explicitSlug = normalizeTenantSlug(requestHeaders.get("x-tenant-slug"))
  const derivedFromHost = resolveTenantSlugFromHost(requestHeaders.get("host"))

  return explicitSlug || derivedFromHost || DEFAULT_TENANT_SLUG
}

export async function getTenantContextBySlugOrDefault(slug?: string): Promise<TenantContext> {
  const normalizedSlug = normalizeTenantSlug(slug) || DEFAULT_TENANT_SLUG
  const tenant =
    (await db.tenant.findFirst({
      where: {
        OR: [{ slug: normalizedSlug }, { domain: normalizedSlug }],
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        mode: true,
      },
    })) ??
    (await db.tenant.findFirstOrThrow({
      where: {
        slug: DEFAULT_TENANT_SLUG,
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        mode: true,
      },
    }))

  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    mode: tenant.mode,
  }
}

export async function getTenantContext() {
  return getTenantContextBySlugOrDefault(await getTenantRequestCandidate())
}

export function withTenant<T extends Prisma.InputJsonObject | Prisma.JsonObject>(
  tenantId: string,
  value: T
) {
  return {
    ...value,
    tenantId,
  }
}

export function scopedWhere<T extends object>(tenantId: string, where?: T) {
  return {
    ...(where ?? {}),
    tenantId,
  } as T & { tenantId: string }
}

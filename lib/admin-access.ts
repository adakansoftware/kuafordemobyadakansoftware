import { AdminUserRole, SubscriptionPlan } from "@prisma/client"

export type AdminAccessContext = {
  tenantId: string
  tenantSlug: string
  actorIdentifier: string
  role: AdminUserRole
  staffId: string | null
  source: "admin_user" | "admin_session" | "basic_auth_fallback"
}

export function hasRequiredRole(role: AdminUserRole, allowedRoles: AdminUserRole[]) {
  return allowedRoles.includes(role)
}

export function canManageAppointment(input: {
  role: AdminUserRole
  actorStaffId: string | null
  appointmentStaffId: string | null
}) {
  if (input.role === AdminUserRole.OWNER || input.role === AdminUserRole.MANAGER) {
    return true
  }

  if (input.role === AdminUserRole.STAFF) {
    return Boolean(input.actorStaffId && input.actorStaffId === input.appointmentStaffId)
  }

  return false
}

export function canViewSettings(role: AdminUserRole) {
  return role === AdminUserRole.OWNER
}

export function getPlanLimits(plan: SubscriptionPlan) {
  if (plan === SubscriptionPlan.PRO) {
    return {
      maxStaffCount: Infinity,
      maxMonthlyAppointments: Infinity,
      reportsEnabled: true,
      inventoryEnabled: true,
      advancedSettingsEnabled: true,
    }
  }

  if (plan === SubscriptionPlan.BASIC) {
    return {
      maxStaffCount: 6,
      maxMonthlyAppointments: 400,
      reportsEnabled: false,
      inventoryEnabled: false,
      advancedSettingsEnabled: false,
    }
  }

  return {
    maxStaffCount: 3,
    maxMonthlyAppointments: 120,
    reportsEnabled: false,
    inventoryEnabled: false,
    advancedSettingsEnabled: false,
  }
}

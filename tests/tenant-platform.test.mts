import assert from "node:assert/strict"
import { AdminUserRole, SubscriptionPlan } from "@prisma/client"
import { canManageAppointment, canViewSettings, getPlanLimits, hasRequiredRole } from "../lib/admin-access.ts"
import { countAvailableStaffForSlot, isStaffAvailableForWindow } from "../lib/staff-availability.ts"
import { filterRecordsByTenantId, isCrossTenantAccess, normalizeTenantSlug, resolveTenantSlugFromHost } from "../lib/tenant-core.ts"

export function runTenantPlatformTests() {
  assert.equal(normalizeTenantSlug("  AdaKan Salon  "), "adakan-salon")
  assert.equal(resolveTenantSlugFromHost("demo.example.com"), "demo")
  assert.equal(resolveTenantSlugFromHost("localhost:3000"), null)
  assert.equal(isCrossTenantAccess("tenant_a", "tenant_b"), true)
  assert.equal(isCrossTenantAccess("tenant_a", "tenant_a"), false)

  const filtered = filterRecordsByTenantId(
    [
      { id: "1", tenantId: "tenant_a" },
      { id: "2", tenantId: "tenant_b" },
    ],
    "tenant_a"
  )
  assert.deepEqual(filtered.map((item) => item.id), ["1"])

  assert.equal(hasRequiredRole(AdminUserRole.OWNER, [AdminUserRole.OWNER]), true)
  assert.equal(hasRequiredRole(AdminUserRole.STAFF, [AdminUserRole.OWNER, AdminUserRole.MANAGER]), false)
  assert.equal(canViewSettings(AdminUserRole.OWNER), true)
  assert.equal(canViewSettings(AdminUserRole.MANAGER), false)

  assert.equal(
    canManageAppointment({
      role: AdminUserRole.STAFF,
      actorStaffId: "staff_1",
      appointmentStaffId: "staff_1",
    }),
    true
  )
  assert.equal(
    canManageAppointment({
      role: AdminUserRole.STAFF,
      actorStaffId: "staff_1",
      appointmentStaffId: "staff_2",
    }),
    false
  )

  const proLimits = getPlanLimits(SubscriptionPlan.PRO)
  const basicLimits = getPlanLimits(SubscriptionPlan.BASIC)
  assert.equal(proLimits.inventoryEnabled, true)
  assert.equal(basicLimits.inventoryEnabled, false)

  const staffSnapshot = {
    staffId: "staff_1",
    isActive: true,
    availabilities: [
      {
        dayOfWeek: 3,
        startTime: "10:00",
        endTime: "18:00",
        breakStartTime: "13:00",
        breakEndTime: "14:00",
        isActive: true,
      },
    ],
    timeOff: [],
  }

  assert.equal(
    isStaffAvailableForWindow(staffSnapshot, {
      scheduledDate: "2099-06-10",
      scheduledTime: "10:00",
      durationMinutes: 60,
    }),
    true
  )
  assert.equal(
    isStaffAvailableForWindow(staffSnapshot, {
      scheduledDate: "2099-06-10",
      scheduledTime: "13:00",
      durationMinutes: 30,
    }),
    false
  )

  const availableCount = countAvailableStaffForSlot({
    staff: [staffSnapshot],
    bookings: [
      {
        staffId: "staff_2",
        scheduledDate: "2099-06-10",
        scheduledTime: "10:00",
        durationMinutes: 60,
      },
    ],
    candidate: {
      scheduledDate: "2099-06-10",
      scheduledTime: "10:00",
      durationMinutes: 30,
    },
  })
  assert.equal(availableCount, 1)

  const blockedCount = countAvailableStaffForSlot({
    staff: [staffSnapshot],
    bookings: [
      {
        staffId: "staff_1",
        scheduledDate: "2099-06-10",
        scheduledTime: "10:00",
        durationMinutes: 60,
      },
    ],
    candidate: {
      scheduledDate: "2099-06-10",
      scheduledTime: "10:30",
      durationMinutes: 30,
    },
  })
  assert.equal(blockedCount, 0)
}

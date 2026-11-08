import { AdminUserRole } from "@prisma/client"
import { AdminMfaSettingsForm } from "@/components/admin/admin-mfa-settings-form"
import { BusinessSettingsForm } from "@/components/admin/business-settings-form"
import { getBusinessSettings } from "@/lib/bookings-repository"
import { createPendingMfaEnrollmentToken } from "@/lib/admin-mfa"
import { getAdminSecurityProfile, getTenantSubscriptionDetails, listAdminUsers } from "@/lib/salon-ops-repository"
import { requireAdminRoles } from "@/lib/security"

export default async function AdminSettingsPage() {
  const accessContext = await requireAdminRoles([AdminUserRole.OWNER])
  const [settings, subscription, users, securityProfile] = await Promise.all([
    getBusinessSettings(),
    getTenantSubscriptionDetails(),
    listAdminUsers(),
    getAdminSecurityProfile({
      tenantId: accessContext.tenantId,
      username: accessContext.actorIdentifier,
    }),
  ])
  const enrollment = createPendingMfaEnrollmentToken({
    adminUserId: securityProfile.id,
    tenantSlug: accessContext.tenantSlug,
    username: securityProfile.username,
  })

  const workingHoursNote =
    settings?.workingHours && typeof settings.workingHours === "object" && "note" in settings.workingHours
      ? String(settings.workingHours.note ?? "")
      : ""

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-3xl font-bold text-foreground">Isletme Ayarlari</h2>
            <div className="mt-4">
              <BusinessSettingsForm
                settings={{
                  businessName: settings?.businessName ?? "",
                  tagline: settings?.tagline ?? "",
                  phone: settings?.phone ?? "",
                  whatsappPhone: settings?.whatsappPhone ?? "",
                  email: settings?.email ?? "",
                  address: settings?.address ?? "",
                  city: settings?.city ?? "",
                  currency: settings?.currency ?? "TRY",
                  dailyCapacity: settings?.dailyCapacity ?? 24,
                  workingHoursNote,
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-serif text-2xl font-bold text-foreground">Abonelik</h3>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>Plan: {subscription.subscription.plan}</p>
                <p>Personel limiti: {String(subscription.limits.maxStaffCount)}</p>
                <p>Aylik randevu limiti: {String(subscription.limits.maxMonthlyAppointments)}</p>
                <p>Raporlar: {subscription.limits.reportsEnabled ? "Acik" : "Kapali"}</p>
                <p>Stok modulu: {subscription.limits.inventoryEnabled ? "Acik" : "Kapali"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-serif text-2xl font-bold text-foreground">Yetkili Kullanicilar</h3>
              <div className="mt-4 space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="rounded-xl border border-border/80 bg-secondary/20 p-4">
                    <div className="font-medium text-foreground">{user.username}</div>
                    <div className="text-sm text-muted-foreground">{user.role} / {user.email}</div>
                    <div className="text-sm text-muted-foreground">{user.staff?.name ?? "Staff bagli degil"}</div>
                    <div className="text-sm text-muted-foreground">MFA: {user.mfaEnabledAt ? "Aktif" : "Kapali"}</div>
                  </div>
                ))}
              </div>
            </div>

            <AdminMfaSettingsForm
              profile={{
                username: securityProfile.username,
                mfaEnabled: Boolean(securityProfile.mfaEnabledAt),
                enabledAtLabel: securityProfile.mfaEnabledAt?.toLocaleString("tr-TR") ?? null,
              }}
              enrollment={{
                enrollmentToken: enrollment.enrollmentToken,
                displaySecret: enrollment.displaySecret,
                otpauthUri: enrollment.otpauthUri,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

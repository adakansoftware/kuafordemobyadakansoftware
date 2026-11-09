import { AdminUserRole } from "@prisma/client"
import { AdminMfaSettingsForm } from "@/components/admin/admin-mfa-settings-form"
import { BusinessSettingsForm } from "@/components/admin/business-settings-form"
import { getBusinessSettings } from "@/lib/bookings-repository"
import { createPendingMfaEnrollmentToken } from "@/lib/admin-mfa"
import { getAdminLocale, getAdminMessages } from "@/lib/i18n/admin"
import { getAdminSecurityProfile, getTenantSubscriptionDetails, listAdminUsers } from "@/lib/salon-ops-repository"
import { requireAdminRoles } from "@/lib/security"

export default async function AdminSettingsPage() {
  const accessContext = await requireAdminRoles([AdminUserRole.OWNER])
  const [settings, subscription, users, securityProfile, locale] = await Promise.all([
    getBusinessSettings(),
    getTenantSubscriptionDetails(),
    listAdminUsers(),
    getAdminSecurityProfile({
      tenantId: accessContext.tenantId,
      username: accessContext.actorIdentifier,
    }),
    getAdminLocale(),
  ])
  const t = getAdminMessages(locale).settings
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
            <h2 className="font-serif text-3xl font-bold text-foreground">{t.businessTitle}</h2>
            <div className="mt-4">
              <BusinessSettingsForm
                locale={locale}
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
              <h3 className="font-serif text-2xl font-bold text-foreground">{t.subscriptionTitle}</h3>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>{t.plan}: {subscription.subscription.plan}</p>
                <p>{t.staffLimit}: {String(subscription.limits.maxStaffCount)}</p>
                <p>{t.monthlyLimit}: {String(subscription.limits.maxMonthlyAppointments)}</p>
                <p>{t.reports}: {subscription.limits.reportsEnabled ? t.open : t.closed}</p>
                <p>{t.inventoryModule}: {subscription.limits.inventoryEnabled ? t.open : t.closed}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-serif text-2xl font-bold text-foreground">{t.usersTitle}</h3>
              <div className="mt-4 space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="rounded-xl border border-border/80 bg-secondary/20 p-4">
                    <div className="font-medium text-foreground">{user.username}</div>
                    <div className="text-sm text-muted-foreground">{user.role} / {user.email}</div>
                    <div className="text-sm text-muted-foreground">{user.staff?.name ?? t.staffNotLinked}</div>
                    <div className="text-sm text-muted-foreground">{t.mfa}: {user.mfaEnabledAt ? t.active : t.inactive}</div>
                  </div>
                ))}
              </div>
            </div>

            <AdminMfaSettingsForm
              locale={locale}
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

import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import { CustomerPortalForm } from "@/components/customer-portal-form"
import {
  customerPortalLogoutAction,
  getCustomerPortalSessionSnapshot,
  requestCancellationAction,
  updateNotificationPreferencesAction,
} from "@/app/musteri/actions"
import { createPublicFormChallenge } from "@/lib/request-security"
import { routing } from "@/i18n/routing"

export default async function CustomerPortalPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  setRequestLocale(locale)
  const snapshot = await getCustomerPortalSessionSnapshot()
  const securityChallenge = createPublicFormChallenge("customer-portal-request")

  async function requestCancellation(formData: FormData) {
    "use server"

    await requestCancellationAction(
      String(formData.get("appointmentId") ?? ""),
      String(formData.get("reason") ?? "")
    )
  }

  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl space-y-6 px-6 lg:px-8">
        <div className="rounded-3xl bg-primary px-8 py-10 text-primary-foreground">
          <p className="text-sm uppercase tracking-[0.18em] text-primary-foreground/70">Müşteri Paneli</p>
          <h1 className="mt-3 font-serif text-4xl font-bold">Randevu ve Sadakat Takibi</h1>
          <p className="mt-3 text-sm text-primary-foreground/80">
            Telefon veya e-posta ile mock OTP üzerinden giriş yapabilir, randevu geçmişinizi ve sadakat durumunuzu görebilirsiniz.
          </p>
        </div>

        {!snapshot ? <CustomerPortalForm securityChallenge={securityChallenge} /> : null}

        {snapshot ? (
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 flex justify-end">
              <form action={customerPortalLogoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-input bg-background px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-accent"
                >
                  Çıkış Yap
                </button>
              </form>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard label="Sadakat Puanı" value={String(snapshot.loyaltyPoints)} />
              <MetricCard label="Toplam Harcama" value={formatCurrency(snapshot.totalSpending)} />
              <MetricCard label="Tamamlanan İşlem" value={String(snapshot.completedPaidAppointments)} />
              <MetricCard label="İndirim Hakkı" value={String(snapshot.discountCount)} />
            </div>

            <div className="mt-6 rounded-2xl border border-border/80 bg-secondary/20 p-4">
              <form action={updateNotificationPreferencesAction} className="grid gap-3">
                <p className="text-sm font-medium text-foreground">Bildirim Tercihleri</p>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    name="emailOptIn"
                    value="true"
                    defaultChecked={snapshot.notificationPreference?.emailOptIn ?? false}
                    className="h-4 w-4 rounded border-input accent-accent"
                  />
                  <span>E-posta ile randevu onayı ve hatırlatma almak istiyorum.</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    name="smsOptIn"
                    value="true"
                    defaultChecked={snapshot.notificationPreference?.smsOptIn ?? false}
                    className="h-4 w-4 rounded border-input accent-accent"
                  />
                  <span>SMS ile randevu hatırlatması almak istiyorum.</span>
                </label>
                <button
                  type="submit"
                  className="justify-self-start rounded-xl border border-input bg-background px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-accent"
                >
                  Tercihleri Kaydet
                </button>
              </form>
            </div>

            <div className="mt-6 space-y-4">
              {snapshot.appointments.map((appointment) => (
                <div key={appointment.id} className="rounded-2xl border border-border/80 bg-secondary/20 p-4">
                  <div className="font-medium text-foreground">{appointment.service.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {appointment.scheduledDate} / {appointment.scheduledTime} / {appointment.status}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {appointment.payment ? `Ödeme: ${formatCurrency(appointment.payment.amount)}` : "Ödeme bekliyor"}
                  </div>
                  {appointment.status === "NEW" || appointment.status === "CONFIRMED" ? (
                    <form action={requestCancellation} className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                      <input type="hidden" name="appointmentId" value={appointment.id} />
                      <input
                        type="text"
                        name="reason"
                        placeholder="İptal nedeni"
                        className="rounded-xl border border-input bg-background px-4 py-3 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-xl border border-input bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground"
                      >
                        İptal Talebi Oluştur
                      </button>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-serif text-3xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(value)
}

import { CustomerPortalForm } from "@/components/customer-portal-form"
import { getCustomerPortalSessionSnapshot, requestCancellationAction } from "@/app/musteri/actions"

export default async function CustomerPortalPage() {
  const snapshot = await getCustomerPortalSessionSnapshot()

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
          <p className="text-sm uppercase tracking-[0.18em] text-primary-foreground/70">Musteri Paneli</p>
          <h1 className="mt-3 font-serif text-4xl font-bold">Randevu ve Sadakat Takibi</h1>
          <p className="mt-3 text-sm text-primary-foreground/80">
            Telefon veya e-posta ile mock OTP uzerinden giris yapabilir, randevu gecmisinizi ve sadakat durumunuzu gorebilirsiniz.
          </p>
        </div>

        {!snapshot ? <CustomerPortalForm /> : null}

        {snapshot ? (
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard label="Sadakat Puani" value={String(snapshot.loyaltyPoints)} />
              <MetricCard label="Toplam Harcama" value={formatCurrency(snapshot.totalSpending)} />
              <MetricCard label="Tamamlanan Islem" value={String(snapshot.completedPaidAppointments)} />
              <MetricCard label="Indirim Hakki" value={String(snapshot.discountCount)} />
            </div>

            <div className="mt-6 space-y-4">
              {snapshot.appointments.map((appointment) => (
                <div key={appointment.id} className="rounded-2xl border border-border/80 bg-secondary/20 p-4">
                  <div className="font-medium text-foreground">{appointment.service.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {appointment.scheduledDate} / {appointment.scheduledTime} / {appointment.status}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {appointment.payment ? `Odeme: ${formatCurrency(appointment.payment.amount)}` : "Odeme bekliyor"}
                  </div>
                  {appointment.status === "NEW" || appointment.status === "CONFIRMED" ? (
                    <form action={requestCancellation} className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                      <input type="hidden" name="appointmentId" value={appointment.id} />
                      <input
                        type="text"
                        name="reason"
                        placeholder="Iptal nedeni"
                        className="rounded-xl border border-input bg-background px-4 py-3 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-xl border border-input bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-foreground"
                      >
                        Iptal Talebi Olustur
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

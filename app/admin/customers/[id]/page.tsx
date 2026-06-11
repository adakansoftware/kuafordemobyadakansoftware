import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AdminUserRole, AppointmentStatus } from "@prisma/client"
import { CustomerNotesForm } from "@/components/admin/customer-notes-form"
import { requireAdminRoles } from "@/lib/security"
import { buildAppointmentWhatsAppMessages, buildCustomerWhatsAppUrl, getPaymentMethodLabel } from "@/lib/salon-ops"
import { getBusinessSettings } from "@/lib/bookings-repository"
import { getCustomerDetail } from "@/lib/salon-ops-repository"
import { siteContent } from "@/lib/site-content"

type CustomerDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export const metadata: Metadata = {
  title: "Musteri Detayi | Admin",
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = "force-dynamic"

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  await requireAdminRoles([AdminUserRole.OWNER, AdminUserRole.MANAGER])

  const { id } = await params
  let detail

  try {
    detail = await getCustomerDetail(id)
  } catch {
    notFound()
  }

  const settings = await getBusinessSettings()
  const { customer, totalSpending, cancellationCount, lastVisit, completedPaidAppointments, discountCount } = detail

  const businessName = settings?.businessName ?? "Adakan Hair Studio"

  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-7xl space-y-8 px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/admin" className="text-sm uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground">
              Admina Don
            </Link>
            <h1 className="mt-3 font-serif text-4xl font-bold text-foreground">{customer.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Musteri gecmisi, sadakat, notlar ve odeme durumu bu sayfadan izlenir.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Toplam Harcama" value={formatCurrency(totalSpending)} />
            <SummaryCard label="Sadakat Puani" value={String(customer.loyaltyPoints)} />
            <SummaryCard label="Indirim Hakki" value={String(discountCount)} />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1.5fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-serif text-2xl font-bold text-foreground">Musteri Bilgileri</h2>
              <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
                <p>Telefon: {customer.phone ?? "Kayitli degil"}</p>
                <p>E-posta: {customer.email ?? "Kayitli degil"}</p>
                <p>Toplam randevu: {customer.appointments.length}</p>
                <p>Odenmis tamamlanan islem: {completedPaidAppointments}</p>
                <p>Iptal sayisi: {cancellationCount}</p>
                <p>Son gelis tarihi: {lastVisit ? `${lastVisit.scheduledDate} / ${lastVisit.scheduledTime}` : "Henuz yok"}</p>
                <p>Kayit tarihi: {customer.createdAt.toLocaleDateString("tr-TR")}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-serif text-2xl font-bold text-foreground">Admin Notlari</h2>
              <div className="mt-4">
                <CustomerNotesForm customerId={customer.id} notes={customer.notes} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground">Tum Randevu Gecmisi</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Durum, personel, odeme ve WhatsApp aksiyonlariyla birlikte tam operasyon kaydi.
                </p>
              </div>
              <span className="rounded-full bg-secondary px-4 py-2 text-sm text-foreground">
                {customer.appointments.length} kayit
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {customer.appointments.map((appointment) => {
                const messages = buildAppointmentWhatsAppMessages({
                  customerName: customer.name,
                  scheduledDate: appointment.scheduledDate,
                  scheduledTime: appointment.scheduledTime,
                  serviceTitle: appointment.service.title,
                  businessName,
                })

                return (
                  <article key={appointment.id} className="rounded-2xl border border-border/80 bg-secondary/20 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-foreground">{appointment.service.title}</h3>
                          <StatusBadge status={appointment.status} />
                          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            {appointment.payment ? "Odeme alindi" : "Odeme bekliyor"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {appointment.scheduledDate} / {appointment.scheduledTime}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Personel: {appointment.staff?.name ?? "Atanmamis"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Tutar: {formatCurrency(appointment.payment?.amount ?? appointment.service.priceFrom)}
                        </p>
                        {appointment.notes ? <p className="text-sm text-muted-foreground">Not: {appointment.notes}</p> : null}
                        {appointment.payment?.note ? (
                          <p className="text-sm text-muted-foreground">Odeme notu: {appointment.payment.note}</p>
                        ) : null}
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          {appointment.payment
                            ? `${getPaymentMethodLabel(appointment.payment.method)} / ${appointment.payment.paidAt.toLocaleString("tr-TR")}`
                            : "Tahsilat bekleniyor"}
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <WhatsAppLink href={buildCustomerWhatsAppUrl(customer.phone, messages.reminder)} label="Hatirlatma" />
                          <WhatsAppLink href={buildCustomerWhatsAppUrl(customer.phone, messages.confirmation)} label="Onay" />
                          <WhatsAppLink href={buildCustomerWhatsAppUrl(customer.phone, messages.cancellation)} label="Iptal" />
                          <WhatsAppLink href={buildCustomerWhatsAppUrl(customer.phone, messages.paymentReminder)} label="Odeme" />
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-serif text-3xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const className =
    status === "CONFIRMED"
      ? "bg-emerald-500/10 text-emerald-700"
      : status === "COMPLETED"
        ? "bg-sky-500/10 text-sky-700"
        : status === "CANCELLED"
          ? "bg-rose-500/10 text-rose-700"
          : "bg-amber-500/10 text-amber-700"

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${className}`}>
      {siteContent.admin.statusLabels[status]}
    </span>
  )
}

function WhatsAppLink({ href, label }: { href: string | null; label: string }) {
  if (!href) {
    return (
      <span className="rounded-full border border-dashed border-input px-3 py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-full border border-input bg-background px-3 py-2 text-xs uppercase tracking-[0.16em] text-foreground transition-colors hover:border-accent"
    >
      {label}
    </a>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value)
}

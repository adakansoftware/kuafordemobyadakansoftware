"use client"

import { PaymentMethod, type AppointmentStatus } from "@prisma/client"
import Link from "next/link"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import {
  type RecordPaymentActionState,
  type UpdateAppointmentActionState,
  recordAppointmentPaymentAction,
  updateAppointmentAction,
} from "@/app/(admin)/admin/actions"
import {
  buildAppointmentWhatsAppMessages,
  buildCustomerWhatsAppUrl,
  getPaymentMethodLabel,
  getPaymentMethodOptions,
} from "@/lib/salon-ops"
import { getAdminMessages } from "@/lib/i18n/admin-messages"
import type { Locale } from "@/lib/i18n/validation"
import { getSiteContent } from "@/lib/content"

type StaffOption = {
  id: string
  name: string
  role: string
}

type AppointmentOperationCardProps = {
  appointment: {
    id: string
    status: AppointmentStatus
    scheduledDate: string
    scheduledTime: string
    notes: string | null
    customer: {
      id: string
      name: string
      phone: string | null
      email: string | null
    }
    service: {
      title: string
      priceFrom: number
    }
    staff: {
      id: string
      name: string
      commissionRate: number
    } | null
    payment: {
      amount: number
      method: PaymentMethod
      paidAt: Date
      note: string | null
    } | null
  }
  staffOptions: StaffOption[]
  businessName: string
  locale: Locale
}

const initialAppointmentState: UpdateAppointmentActionState = {
  success: false,
  message: "",
}

const initialPaymentState: RecordPaymentActionState = {
  success: false,
  message: "",
}

const statusOptions: AppointmentStatus[] = ["NEW", "CONFIRMED", "COMPLETED", "CANCELLED"]

export function AppointmentOperations({
  appointment,
  staffOptions,
  businessName,
  locale,
}: AppointmentOperationCardProps) {
  const [appointmentState, appointmentFormAction] = useActionState(updateAppointmentAction, initialAppointmentState)
  const [paymentState, paymentFormAction] = useActionState(recordAppointmentPaymentAction, initialPaymentState)
  const currentAppointmentState =
    appointmentState.appointmentId === appointment.id ? appointmentState : initialAppointmentState
  const currentPaymentState = paymentState.appointmentId === appointment.id ? paymentState : initialPaymentState
  const t = getAdminMessages(locale).appointmentOps
  const statusLabels = getSiteContent(locale).admin.statusLabels

  const assignedStaffLabel = (() => {
    if (!appointment.staff) {
      return t.notAssignedYet
    }

    const staffId = appointment.staff.id
    const matched = staffOptions.find((staff) => staff.id === staffId)
    return matched ? `${matched.name} - ${matched.role}` : appointment.staff.name
  })()

  const whatsappMessages = buildAppointmentWhatsAppMessages({
    customerName: appointment.customer.name,
    scheduledDate: appointment.scheduledDate,
    scheduledTime: appointment.scheduledTime,
    serviceTitle: appointment.service.title,
    businessName,
  })

  const whatsappLinks = {
    reminder: buildCustomerWhatsAppUrl(appointment.customer.phone, whatsappMessages.reminder),
    confirmation: buildCustomerWhatsAppUrl(appointment.customer.phone, whatsappMessages.confirmation),
    cancellation: buildCustomerWhatsAppUrl(appointment.customer.phone, whatsappMessages.cancellation),
    paymentReminder: buildCustomerWhatsAppUrl(appointment.customer.phone, whatsappMessages.paymentReminder),
  }

  return (
    <article className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-serif text-xl font-bold text-foreground">{appointment.customer.name}</h3>
            <StatusBadge status={appointment.status} locale={locale} />
            <span className="rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
              {appointment.payment ? t.paymentReceived : t.paymentPending}
            </span>
          </div>

          <div className="grid gap-1 text-sm text-muted-foreground">
            <p>
              {appointment.service.title} / {appointment.scheduledDate} / {appointment.scheduledTime}
            </p>
            <p>{t.phone}: {appointment.customer.phone ?? t.none}</p>
            <p>{t.email}: {appointment.customer.email ?? t.none}</p>
            <p>{t.staff}: {assignedStaffLabel}</p>
            <p>{t.estimatedAmount}: {formatCurrency(appointment.service.priceFrom)}</p>
            <p>
              {t.customerCard}:{" "}
              <Link className="text-accent underline-offset-4 hover:underline" href={`/admin/customers/${appointment.customer.id}`}>
                {t.openDetails}
              </Link>
            </p>
          </div>

          {appointment.payment ? (
            <div className="rounded-2xl bg-emerald-500/10 px-4 py-4 text-sm text-emerald-800">
              <div className="font-medium">{t.paymentRecordTitle}</div>
              <div className="mt-1">
                {formatCurrency(appointment.payment.amount)} / {getPaymentMethodLabel(appointment.payment.method, locale)} /{" "}
                {appointment.payment.paidAt.toLocaleString("tr-TR")}
              </div>
              {appointment.payment.note ? <div className="mt-1">{appointment.payment.note}</div> : null}
            </div>
          ) : appointment.status === "COMPLETED" ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              {t.noPaymentForCompleted}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <WhatsAppLink href={whatsappLinks.reminder} label={t.reminder} />
            <WhatsAppLink href={whatsappLinks.confirmation} label={t.confirmation} />
            <WhatsAppLink href={whatsappLinks.cancellation} label={t.cancellation} />
            <WhatsAppLink href={whatsappLinks.paymentReminder} label={t.paymentReminder} />
          </div>
        </div>

        <div className="space-y-4">
          <form action={appointmentFormAction} className="grid gap-3 rounded-2xl border border-border/80 bg-secondary/20 p-4">
            <input type="hidden" name="appointmentId" value={appointment.id} />
            <input type="hidden" name="currentStatus" value={appointment.status} />

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-foreground">
                <span className="font-medium">{t.status}</span>
                <select
                  name="status"
                  defaultValue={appointment.status}
                  className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm text-foreground">
                <span className="font-medium">{t.staffSelect}</span>
                <select
                  name="staffId"
                  defaultValue={appointment.staff?.id ?? ""}
                  className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                >
                  <option value="">{t.unassignedOption}</option>
                  {staffOptions.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} - {staff.role}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm text-foreground">
              <span className="font-medium">{t.operationNote}</span>
              <textarea
                name="notes"
                defaultValue={appointment.notes ?? ""}
                rows={3}
                placeholder={t.operationNotePlaceholder}
                maxLength={500}
                className="resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </label>

            <label className="grid gap-2 text-sm text-foreground">
              <span className="font-medium">{t.adminPassword}</span>
              <input
                type="password"
                name="adminPassword"
                autoComplete="current-password"
                placeholder={t.adminPasswordPlaceholder}
                className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </label>

            <label className="grid gap-2 text-sm text-foreground">
              <span className="font-medium">{t.totpCode}</span>
              <input
                name="adminTotpCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={t.totpPlaceholder}
                className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </label>

            <div className="flex items-center justify-between gap-4">
              <p className={currentAppointmentState.success ? "text-sm text-green-600" : "text-sm text-muted-foreground"}>
                {currentAppointmentState.message || t.updateHint}
              </p>
              <SubmitButton label={t.updateButton} pendingLabel={t.saving} />
            </div>
          </form>

          {appointment.status === "COMPLETED" && !appointment.payment ? (
            <form action={paymentFormAction} className="grid gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <input type="hidden" name="appointmentId" value={appointment.id} />

              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-foreground">
                  <span className="font-medium">{t.paymentAmount}</span>
                  <input
                    type="number"
                    name="amount"
                    min={1}
                    defaultValue={appointment.service.priceFrom}
                    className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                </label>

                <label className="grid gap-2 text-sm text-foreground">
                  <span className="font-medium">{t.method}</span>
                  <select
                    name="method"
                    defaultValue={PaymentMethod.CARD}
                    className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                  >
                    {getPaymentMethodOptions(locale).map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm text-foreground">
                <span className="font-medium">{t.paymentNote}</span>
                <input
                  type="text"
                  name="note"
                  placeholder={t.paymentNotePlaceholder}
                  className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </label>

              <label className="grid gap-2 text-sm text-foreground">
                <span className="font-medium">{t.paymentAdminPassword}</span>
                <input
                  type="password"
                  name="adminPassword"
                  autoComplete="current-password"
                  placeholder={t.paymentAdminPasswordPlaceholder}
                  className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </label>

              <label className="grid gap-2 text-sm text-foreground">
                <span className="font-medium">{t.totpCode}</span>
                <input
                  name="adminTotpCode"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder={t.paymentTotpPlaceholder}
                  className="rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </label>

              <div className="flex items-center justify-between gap-4">
                <p className={currentPaymentState.success ? "text-sm text-green-600" : "text-sm text-emerald-800"}>
                  {currentPaymentState.message || t.paymentHint}
                </p>
                <SubmitButton label={t.paymentButton} pendingLabel={t.saving} />
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function StatusBadge({ status, locale }: { status: AppointmentStatus; locale: Locale }) {
  const className =
    status === "CONFIRMED"
      ? "bg-emerald-500/10 text-emerald-700"
      : status === "COMPLETED"
        ? "bg-sky-500/10 text-sky-700"
        : status === "CANCELLED"
          ? "bg-rose-500/10 text-rose-700"
          : "bg-amber-500/10 text-amber-700"

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${className}`}>
      {getSiteContent(locale).admin.statusLabels[status]}
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

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value)
}

import { Prisma } from "@prisma/client"
import type { AppointmentStatus, NotificationChannel } from "@prisma/client"
import { db } from "../db.ts"
import { logEvent } from "../observability.ts"
import type { Locale } from "../i18n/validation.ts"
import { ConsoleNotificationAdapter } from "./adapters/console-adapter.ts"
import { ResendEmailAdapter } from "./adapters/resend-email.ts"
import { SmsHttpAdapter } from "./adapters/sms-adapter.ts"
import {
  eligibleNotificationChannels,
  isConfirmationEnqueueable,
  isReminderEnqueueable,
  reminderScheduledFor,
} from "./reminder-rules.ts"
import { renderNotificationDelivery } from "./templates.ts"
import type { NotificationChannelAdapter } from "./types.ts"
import type { NotificationTemplateKey } from "./templates.ts"

export const NOTIFICATION_MAX_ATTEMPTS = 3
const BACKOFF_BASE_MS = 60_000

export type EnqueueAppointmentNotificationsInput = {
  appointmentId: string
  templateKeys: NotificationTemplateKey[]
  requestId?: string
}

function resolveAdapters(): Map<NotificationChannel, NotificationChannelAdapter> {
  const configured = process.env.NOTIFICATION_ADAPTER ?? "console"
  const adapters = new Map<NotificationChannel, NotificationChannelAdapter>()

  if (configured === "resend" && process.env.RESEND_API_KEY) {
    adapters.set(
      "EMAIL",
      new ResendEmailAdapter(
        process.env.RESEND_API_KEY,
        process.env.RESEND_FROM_ADDRESS ?? "notifications@demo.local"
      )
    )
  } else {
    adapters.set("EMAIL", new ConsoleNotificationAdapter("EMAIL"))
  }

  if (configured === "sms" && process.env.SMS_API_KEY) {
    adapters.set("SMS", new SmsHttpAdapter(process.env.SMS_API_KEY))
  } else {
    adapters.set("SMS", new ConsoleNotificationAdapter("SMS"))
  }

  return adapters
}

function templateScheduledFor(templateKey: NotificationTemplateKey, scheduledAt: Date, now: Date) {
  if (templateKey === "reminder-24h") {
    return reminderScheduledFor(scheduledAt)
  }

  return now
}

function payloadString(payload: Prisma.JsonValue, key: string): string | null {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const value = (payload as Record<string, unknown>)[key]

    if (typeof value === "string" && value) {
      return value
    }
  }

  return null
}

function isTemplateEnqueueable(
  templateKey: NotificationTemplateKey,
  status: AppointmentStatus,
  scheduledAt: Date,
  now: Date
) {
  if (templateKey === "reminder-24h") {
    return isReminderEnqueueable({ status, scheduledAt }, now)
  }

  if (templateKey === "appointment-cancelled") {
    return true
  }

  return isConfirmationEnqueueable({ status, scheduledAt })
}

export async function upsertNotificationPreference(input: {
  tenantId: string
  customerId: string
  emailOptIn?: boolean
  smsOptIn?: boolean
  locale?: Locale
}) {
  const existing = await db.notificationPreference.findUnique({
    where: { customerId: input.customerId },
  })

  return db.notificationPreference.upsert({
    where: { customerId: input.customerId },
    create: {
      tenantId: input.tenantId,
      customerId: input.customerId,
      emailOptIn: input.emailOptIn ?? false,
      smsOptIn: input.smsOptIn ?? false,
      locale: input.locale ?? "tr",
    },
    update: {
      emailOptIn: input.emailOptIn ?? existing?.emailOptIn ?? false,
      smsOptIn: input.smsOptIn ?? existing?.smsOptIn ?? false,
      locale: input.locale ?? existing?.locale ?? "tr",
    },
  })
}

export type NotificationDashboardSnapshot = {
  counts: {
    PENDING: number
    SENT: number
    FAILED: number
    SKIPPED: number
  }
  recent: Array<{
    id: string
    templateKey: string
    channel: NotificationChannel
    status: string
    recipient: string
    scheduledFor: Date
    sentAt: Date | null
  }>
}

export async function getNotificationDashboardSnapshot(): Promise<NotificationDashboardSnapshot> {
  const [groups, recent] = await Promise.all([
    db.notification.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    db.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        customer: {
          select: { email: true, phone: true },
        },
      },
    }),
  ])

  const counts = { PENDING: 0, SENT: 0, FAILED: 0, SKIPPED: 0 }

  for (const group of groups) {
    if (group.status in counts) {
      counts[group.status as keyof typeof counts] = group._count._all
    }
  }

  return {
    counts,
    recent: recent.map((notification) => ({
      id: notification.id,
      templateKey: notification.templateKey,
      channel: notification.channel,
      status: notification.status,
      recipient:
        notification.channel === "EMAIL"
          ? (notification.customer.email ?? "—")
          : (notification.customer.phone ?? "—"),
      scheduledFor: notification.scheduledFor,
      sentAt: notification.sentAt,
    })),
  }
}

export async function enqueueAppointmentNotifications(input: EnqueueAppointmentNotificationsInput) {
  const appointment = await db.appointment.findUnique({
    where: { id: input.appointmentId },
    include: {
      customer: {
        include: {
          notificationPreference: true,
        },
      },
      service: true,
      staff: true,
      tenant: {
        include: {
          businessSettings: true,
        },
      },
    },
  })

  if (!appointment) {
    return { enqueued: 0 }
  }

  const now = new Date()
  const channels = eligibleNotificationChannels(
    { email: appointment.customer.email, phone: appointment.customer.phone },
    appointment.customer.notificationPreference
  )

  if (channels.length === 0) {
    return { enqueued: 0 }
  }

  const locale: Locale = appointment.customer.notificationPreference?.locale === "en" ? "en" : "tr"
  const businessName = appointment.tenant.businessSettings?.businessName ?? appointment.tenant.name

  const rows = [] as Array<{
    tenantId: string
    customerId: string
    appointmentId: string
    channel: NotificationChannel
    templateKey: NotificationTemplateKey
    locale: string
    payload: Prisma.InputJsonValue
    scheduledFor: Date
  }>

  for (const templateKey of input.templateKeys) {
    if (!isTemplateEnqueueable(templateKey, appointment.status, appointment.scheduledAt, now)) {
      continue
    }

    const payload: Prisma.InputJsonValue = {
      customerName: appointment.customer.name,
      serviceName: appointment.service.title,
      businessName,
      scheduledDate: appointment.scheduledDate,
      scheduledTime: appointment.scheduledTime,
      staffName: appointment.staff?.name ?? null,
    }

    for (const { channel } of channels) {
      rows.push({
        tenantId: appointment.tenantId,
        customerId: appointment.customerId,
        appointmentId: appointment.id,
        channel,
        templateKey,
        locale,
        payload,
        scheduledFor: templateScheduledFor(templateKey, appointment.scheduledAt, now),
      })
    }
  }

  if (rows.length === 0) {
    return { enqueued: 0 }
  }

  const result = await db.notification.createMany({
    data: rows,
    skipDuplicates: true,
  })

  return { enqueued: result.count }
}

export async function processDueNotifications(limit = 50, requestId?: string) {
  const now = new Date()
  const due = await db.notification.findMany({
    where: {
      status: "PENDING",
      scheduledFor: { lte: now },
    },
    orderBy: { scheduledFor: "asc" },
    take: limit,
    include: {
      customer: true,
      appointment: {
        include: {
          service: true,
          staff: true,
        },
      },
    },
  })

  const adapters = resolveAdapters()
  let sent = 0
  let failed = 0

  for (const notification of due) {
    if (notification.appointment?.status === "CANCELLED" && notification.templateKey !== "appointment-cancelled") {
      await db.notification.update({
        where: { id: notification.id },
        data: { status: "SKIPPED" },
      })
      continue
    }

    const adapter = adapters.get(notification.channel)
    const recipient =
      notification.channel === "EMAIL" ? notification.customer.email : notification.customer.phone

    if (!adapter || !recipient) {
      await db.notification.update({
        where: { id: notification.id },
        data: {
          status: "SKIPPED",
          lastError: !recipient ? "missing_recipient" : "missing_adapter",
        },
      })
      continue
    }

    const templateKey = notification.templateKey as NotificationTemplateKey
    const delivery = renderNotificationDelivery(
      {
        templateKey,
        locale: notification.locale === "en" ? "en" : "tr",
        channel: notification.channel,
        customerName:
          payloadString(notification.payload, "customerName") ?? notification.customer.name,
        serviceName:
          payloadString(notification.payload, "serviceName") ??
          notification.appointment?.service.title ??
          "",
        businessName: payloadString(notification.payload, "businessName") ?? "",
        scheduledDate:
          payloadString(notification.payload, "scheduledDate") ??
          notification.appointment?.scheduledDate ??
          "",
        scheduledTime:
          payloadString(notification.payload, "scheduledTime") ??
          notification.appointment?.scheduledTime ??
          "",
        staffName:
          notification.appointment?.staff?.name ??
          payloadString(notification.payload, "staffName"),
      },
      recipient
    )

    const result = await adapter.send(delivery)

    if (result.ok) {
      sent += 1
      await db.notification.update({
        where: { id: notification.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          attempts: { increment: 1 },
          providerId: result.providerId ?? null,
          lastError: null,
        },
      })
      continue
    }

    const attempts = notification.attempts + 1
    failed += 1

    if (attempts >= NOTIFICATION_MAX_ATTEMPTS) {
      await db.notification.update({
        where: { id: notification.id },
        data: {
          status: "FAILED",
          attempts,
          lastError: result.error ?? "unknown_error",
        },
      })
    } else {
      const backoffMs = BACKOFF_BASE_MS * Math.pow(2, attempts - 1)
      await db.notification.update({
        where: { id: notification.id },
        data: {
          attempts,
          lastError: result.error ?? "unknown_error",
          scheduledFor: new Date(now.getTime() + backoffMs),
        },
      })
    }

    logEvent({
      level: "warn",
      event: "notification_delivery_failed",
      requestId,
      route: "/api/cron/notifications",
      message: result.error ?? "Notification delivery failed.",
      meta: {
        notificationId: notification.id,
        templateKey: notification.templateKey,
        channel: notification.channel,
        attempts,
      },
    })
  }

  return {
    processed: due.length,
    sent,
    failed,
  }
}

import type { AppointmentStatus, NotificationChannel } from "@prisma/client"

export const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000

export type ReminderRuleCustomer = {
  email: string | null
  phone: string | null
}

export type ReminderRulePreference = {
  emailOptIn: boolean
  smsOptIn: boolean
} | null

export type ReminderRuleAppointment = {
  status: AppointmentStatus
  scheduledAt: Date
}

export function reminderScheduledFor(scheduledAt: Date) {
  return new Date(scheduledAt.getTime() - REMINDER_LEAD_MS)
}

export function eligibleNotificationChannels(
  customer: ReminderRuleCustomer,
  preference: ReminderRulePreference
): Array<{ channel: NotificationChannel; recipient: string }> {
  const channels: Array<{ channel: NotificationChannel; recipient: string }> = []

  if (preference?.emailOptIn && customer.email) {
    channels.push({ channel: "EMAIL", recipient: customer.email })
  }

  if (preference?.smsOptIn && customer.phone) {
    channels.push({ channel: "SMS", recipient: customer.phone })
  }

  return channels
}

const REMINDER_BLOCKED_STATUSES: ReadonlySet<AppointmentStatus> = new Set([
  "CANCELLED",
  "COMPLETED",
])

export function isReminderEnqueueable(appointment: ReminderRuleAppointment, now: Date = new Date()) {
  if (REMINDER_BLOCKED_STATUSES.has(appointment.status)) {
    return false
  }

  if (appointment.scheduledAt.getTime() <= now.getTime()) {
    return false
  }

  if (reminderScheduledFor(appointment.scheduledAt).getTime() <= now.getTime()) {
    return false
  }

  return true
}

export function isConfirmationEnqueueable(appointment: ReminderRuleAppointment) {
  return !REMINDER_BLOCKED_STATUSES.has(appointment.status)
}

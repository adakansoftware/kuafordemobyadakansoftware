import type { NotificationChannel } from "@prisma/client"

export type NotificationDelivery = {
  channel: NotificationChannel
  recipient: string
  subject: string
  body: string
}

export type NotificationDeliveryResult = {
  ok: boolean
  providerId?: string
  error?: string
}

export interface NotificationChannelAdapter {
  readonly name: string
  readonly channel: NotificationChannel
  send(delivery: NotificationDelivery): Promise<NotificationDeliveryResult>
}

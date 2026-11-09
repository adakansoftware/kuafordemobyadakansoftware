import type { NotificationChannel } from "@prisma/client"
import { logEvent } from "../../observability.ts"
import type { NotificationChannelAdapter, NotificationDelivery, NotificationDeliveryResult } from "../types.ts"

export class ConsoleNotificationAdapter implements NotificationChannelAdapter {
  readonly name = "console"
  readonly channel: NotificationChannel = "EMAIL"

  constructor(channel: NotificationChannel = "EMAIL") {
    this.channel = channel
  }

  async send(delivery: NotificationDelivery): Promise<NotificationDeliveryResult> {
    logEvent({
      level: "info",
      event: "notification_console_delivery",
      route: "/api/cron/notifications",
      message: `[${this.channel}] ${delivery.recipient} — ${delivery.subject}`,
      meta: {
        channel: this.channel,
        recipient: delivery.recipient,
        subject: delivery.subject,
        body: delivery.body,
      },
    })

    return {
      ok: true,
      providerId: `console-${Date.now()}`,
    }
  }
}

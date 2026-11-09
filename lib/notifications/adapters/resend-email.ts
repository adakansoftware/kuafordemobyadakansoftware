import type { NotificationChannelAdapter, NotificationDelivery, NotificationDeliveryResult } from "../types.ts"

export class ResendEmailAdapter implements NotificationChannelAdapter {
  readonly name = "resend"
  readonly channel = "EMAIL" as const

  private readonly apiKey: string
  private readonly fromAddress: string

  constructor(apiKey: string, fromAddress: string) {
    this.apiKey = apiKey
    this.fromAddress = fromAddress
  }

  async send(delivery: NotificationDelivery): Promise<NotificationDeliveryResult> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: [delivery.recipient],
          subject: delivery.subject,
          text: delivery.body,
        }),
      })

      if (!response.ok) {
        return {
          ok: false,
          error: `resend_http_${response.status}`,
        }
      }

      const payload = (await response.json()) as { id?: string }
      return {
        ok: true,
        providerId: payload.id,
      }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "resend_request_failed",
      }
    }
  }
}

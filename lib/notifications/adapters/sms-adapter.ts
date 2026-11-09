import type { NotificationChannelAdapter, NotificationDelivery, NotificationDeliveryResult } from "../types.ts"

export class SmsHttpAdapter implements NotificationChannelAdapter {
  readonly name = "sms-http"
  readonly channel = "SMS" as const

  private readonly apiKey: string
  private readonly endpoint: string

  constructor(apiKey: string, endpoint = "https://sms.example.com/v1/messages") {
    this.apiKey = apiKey
    this.endpoint = endpoint
  }

  async send(delivery: NotificationDelivery): Promise<NotificationDeliveryResult> {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: delivery.recipient,
          message: delivery.body,
        }),
      })

      if (!response.ok) {
        return {
          ok: false,
          error: `sms_http_${response.status}`,
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
        error: error instanceof Error ? error.message : "sms_request_failed",
      }
    }
  }
}

import { NextResponse } from "next/server"
import { getCurrentRequestId } from "@/lib/http"
import { logEvent } from "@/lib/observability"
import { processDueNotifications } from "@/lib/notifications/notification-service"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const requestId = await getCurrentRequestId()
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    if (process.env.NODE_ENV === "production") {
      logEvent({
        level: "error",
        event: "notification_cron_secret_missing",
        requestId,
        route: "/api/cron/notifications",
        message: "CRON_SECRET is not configured; refusing to run the notification cron in production.",
      })

      return NextResponse.json({ error: "cron_not_configured" }, { status: 503 })
    }

    logEvent({
      level: "warn",
      event: "notification_cron_unprotected",
      requestId,
      route: "/api/cron/notifications",
      message: "CRON_SECRET is not configured; the notification cron endpoint is unprotected in development.",
    })
  } else {
    const authorization = request.headers.get("authorization") ?? ""
    const expected = `Bearer ${cronSecret}`

    if (authorization !== expected) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }
  }

  try {
    const result = await processDueNotifications(50, requestId)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    logEvent({
      level: "error",
      event: "notification_cron_failed",
      requestId,
      route: "/api/cron/notifications",
      message: error instanceof Error ? error.message : "Notification cron run failed.",
    })

    return NextResponse.json({ ok: false, error: "cron_failed" }, { status: 500 })
  }
}

import { processDueNotifications } from "../lib/notifications/notification-service.ts"

const result = await processDueNotifications(
  Number(process.argv[2] ?? 50) || 50
)

console.log(
  `Notifications processed=${result.processed} sent=${result.sent} failed=${result.failed}`
)

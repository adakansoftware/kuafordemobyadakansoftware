import { readFile } from "node:fs/promises"

const filesToCheck = [
  "app/page.tsx",
  "app/randevu/page.tsx",
  "app/randevu/actions.ts",
  "app/hizmetler/page.tsx",
  "app/hakkimizda/page.tsx",
  "app/admin/page.tsx",
  "app/api/bookings/route.ts",
  "app/admin/actions.ts",
  "components/admin/appointment-operations.tsx",
  "lib/admin-appointment-action.ts",
  "lib/booking.ts",
  "lib/booking-action.ts",
  "lib/booking-route.ts",
  "lib/booking-rules.ts",
  "lib/public-site.ts",
  "lib/security.ts",
  "lib/seo.ts",
  "lib/site-content.ts",
]

const forbiddenTokens = [String.fromCharCode(195), String.fromCharCode(196), String.fromCharCode(197), "TODO"]

async function main() {
  for (const file of filesToCheck) {
    const content = await readFile(new URL(`../${file}`, import.meta.url), "utf8")

    for (const token of forbiddenTokens) {
      if (content.includes(token)) {
        throw new Error(`Smoke check failed: "${token}" bulundu -> ${file}`)
      }
    }
  }

  console.log("Smoke check passed.")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

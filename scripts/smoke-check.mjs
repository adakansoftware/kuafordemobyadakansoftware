import { readFile } from "node:fs/promises"

const filesToCheck = [
  "app/page.tsx",
  "app/randevu/page.tsx",
  "app/randevu/actions.ts",
  "app/hizmetler/page.tsx",
  "app/hakkimizda/page.tsx",
  "app/admin/page.tsx",
  "app/admin/customers/[id]/page.tsx",
  "app/admin/dashboard/page.tsx",
  "app/admin/appointments/page.tsx",
  "app/admin/customers/page.tsx",
  "app/admin/staff/page.tsx",
  "app/admin/services/page.tsx",
  "app/admin/packages/page.tsx",
  "app/admin/payments/page.tsx",
  "app/admin/reports/page.tsx",
  "app/admin/settings/page.tsx",
  "app/admin/inventory/page.tsx",
  "app/api/bookings/route.ts",
  "app/musteri/page.tsx",
  "app/setup/page.tsx",
  "app/admin/actions.ts",
  "components/admin/appointment-operations.tsx",
  "components/home/cta-section.tsx",
  "components/home/featured-services.tsx",
  "components/home/gallery-section.tsx",
  "components/home/hero-section.tsx",
  "components/home/intro-section.tsx",
  "components/home/stats-section.tsx",
  "components/home/testimonials-section.tsx",
  "components/home/why-us-section.tsx",
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

  const adminOperations = await readFile(
    new URL("../components/admin/appointment-operations.tsx", import.meta.url),
    "utf8"
  )
  const adminPage = await readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8")

  if (!adminOperations.includes("Odeme Alindi")) {
    throw new Error('Smoke check failed: "Odeme Alindi" aksiyonu bulunamadi -> components/admin/appointment-operations.tsx')
  }

  if (!adminPage.includes("/admin/dashboard")) {
    throw new Error('Smoke check failed: admin giris yonlendirmesi bulunamadi -> app/admin/page.tsx')
  }

  console.log("Smoke check passed.")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

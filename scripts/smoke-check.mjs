import { readFile } from "node:fs/promises"

const filesToCheck = [
  "app/(public)/[locale]/page.tsx",
  "app/(public)/[locale]/randevu/page.tsx",
  "app/randevu/actions.ts",
  "app/(public)/[locale]/hizmetler/page.tsx",
  "app/(public)/[locale]/hakkimizda/page.tsx",
  "app/(admin)/admin/page.tsx",
  "app/(admin)/admin/customers/[id]/page.tsx",
  "app/(admin)/admin/dashboard/page.tsx",
  "app/(admin)/admin/appointments/page.tsx",
  "app/(admin)/admin/customers/page.tsx",
  "app/(admin)/admin/staff/page.tsx",
  "app/(admin)/admin/services/page.tsx",
  "app/(admin)/admin/packages/page.tsx",
  "app/(admin)/admin/payments/page.tsx",
  "app/(admin)/admin/reports/page.tsx",
  "app/(admin)/admin/settings/page.tsx",
  "app/(admin)/admin/inventory/page.tsx",
  "app/api/bookings/route.ts",
  "app/(public)/[locale]/musteri/page.tsx",
  "app/(setup)/setup/page.tsx",
  "app/(admin)/admin/actions.ts",
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
  "lib/i18n/admin-messages.ts",
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
  const adminMessages = await readFile(
    new URL("../lib/i18n/admin-messages.ts", import.meta.url),
    "utf8"
  )
  const adminPage = await readFile(new URL("../app/(admin)/admin/page.tsx", import.meta.url), "utf8")

  if (!adminOperations.includes("getAdminMessages")) {
    throw new Error('Smoke check failed: admin mesaj sözlüğü kullanılmıyor -> components/admin/appointment-operations.tsx')
  }

  if (!adminMessages.includes("Ödeme Alındı")) {
    throw new Error('Smoke check failed: "Ödeme Alındı" aksiyonu bulunamadı -> lib/i18n/admin-messages.ts')
  }

  if (!adminPage.includes("/admin/dashboard")) {
    throw new Error('Smoke check failed: admin giriş yönlendirmesi bulunamadı -> app/admin/page.tsx')
  }

  console.log("Smoke check passed.")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})

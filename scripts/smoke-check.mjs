import { readFile } from "node:fs/promises"

const filesToCheck = [
  "app/page.tsx",
  "app/randevu/page.tsx",
  "app/hizmetler/page.tsx",
  "app/hakkimizda/page.tsx",
  "app/api/bookings/route.ts",
  "lib/site-content.ts",
]

const forbiddenTokens = ["Ã", "Ä", "Å", "undefined", "TODO"]

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

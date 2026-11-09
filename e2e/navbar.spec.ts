import { expect, test } from "@playwright/test"

test("navbar stays transparent on home before scrolling", async ({ page }) => {
  await page.goto("/")

  const header = page.locator("header")
  await expect(header).toHaveClass(/bg-transparent/)
  await expect(header).not.toHaveClass(/bg-background\/90/)
})

test("navbar is solid on inner pages", async ({ page }) => {
  for (const path of ["/hizmetler", "/hakkimizda", "/randevu", "/en/hizmetler", "/en/randevu"]) {
    await page.goto(path)

    const header = page.locator("header")
    await expect(header, `solid navbar expected on ${path}`).toHaveClass(/bg-background\/90/)
    await expect(header, `no transparent navbar on ${path}`).not.toHaveClass(/bg-transparent/)
  }
})

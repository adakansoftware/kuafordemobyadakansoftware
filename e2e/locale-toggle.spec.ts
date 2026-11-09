import { expect, test } from "@playwright/test"

test("locale toggle switches language and preserves the path", async ({ page }) => {
  await page.goto("/en/hizmetler")
  await expect(page.locator("html")).toHaveAttribute("lang", "en")

  await page.locator("nav").getByRole("link", { name: "TR", exact: true }).click()

  await expect(page).toHaveURL(/\/hizmetler$/)
  await expect(page.locator("html")).toHaveAttribute("lang", "tr")

  await page.locator("nav").getByRole("link", { name: "EN", exact: true }).click()

  await expect(page).toHaveURL(/\/en\/hizmetler$/)
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
})

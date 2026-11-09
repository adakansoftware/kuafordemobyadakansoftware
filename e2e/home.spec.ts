import { expect, test } from "@playwright/test"

test("home renders Turkish by default", async ({ page }) => {
  await page.goto("/")

  await expect(page.locator("html")).toHaveAttribute("lang", "tr")
  await expect(page.getByText("Güven veren salon deneyimi")).toBeVisible()
})

test("home faq section toggles an item", async ({ page }) => {
  await page.goto("/")

  const firstQuestion = "Randevu nasıl oluşturuluyor ve ne zaman teyit ediliyor?"
  await expect(page.getByText("Merak edilenler")).toBeVisible()

  const trigger = page.getByRole("button", { name: firstQuestion })
  const answer = page.getByText(
    "Online randevu formundan hizmet, tarih ve saati seçerek talebinizi iletebilirsiniz.",
    { exact: false }
  )
  await trigger.click()
  await expect(answer).toBeVisible()
  await trigger.click()
  await expect(answer).toBeHidden()
})

test("home renders English under /en", async ({ page }) => {
  await page.goto("/en")

  await expect(page.locator("html")).toHaveAttribute("lang", "en")
  await expect(page.getByText("A salon experience you can trust")).toBeVisible()
})

test("services page renders both locales", async ({ page }) => {
  await page.goto("/hizmetler")
  await expect(page.locator("html")).toHaveAttribute("lang", "tr")

  await page.goto("/en/hizmetler")
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
})

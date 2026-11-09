import { expect, test } from "@playwright/test"

async function submitWithoutNativeValidation(page: import("@playwright/test").Page) {
  // Native `required` attributes would block the submit event before the
  // client-side zod validation runs; disable them to exercise the messages.
  await page.evaluate(() => {
    const form = document.querySelector("form")
    if (form) {
      form.noValidate = true
    }
  })
  await page.locator('button[type="submit"]').click()
}

test("booking form shows Turkish validation errors", async ({ page }) => {
  await page.goto("/randevu")

  await submitWithoutNativeValidation(page)

  await expect(page.getByText("Lütfen bir tarih seçin.")).toBeVisible()
})

test("booking form shows English validation errors", async ({ page }) => {
  await page.goto("/en/randevu")

  await submitWithoutNativeValidation(page)

  await expect(page.getByText("Please select a date.")).toBeVisible()
})

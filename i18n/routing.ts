import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["tr", "en"],
  defaultLocale: "tr",
  localePrefix: "as-needed",
  localeDetection: false,
})

export type AppLocale = (typeof routing.locales)[number]

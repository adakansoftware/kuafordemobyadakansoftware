import { cookies } from "next/headers"
import type { Locale } from "./validation.ts"

export const ADMIN_LOCALE_COOKIE = "adminLocale"

export async function getAdminLocale(): Promise<Locale> {
  const store = await cookies()
  return store.get(ADMIN_LOCALE_COOKIE)?.value === "en" ? "en" : "tr"
}

export async function setAdminLocaleCookie(locale: Locale) {
  const store = await cookies()
  store.set(ADMIN_LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/admin",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  })
}

export { getAdminMessages, formatAdminMessage, adminMessages } from "./admin-messages.ts"
export type { AdminMessages } from "./admin-messages.ts"

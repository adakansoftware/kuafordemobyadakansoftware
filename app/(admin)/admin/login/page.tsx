import { redirect } from "next/navigation"
import { resolveAdminSession } from "@/lib/admin-session"
import { createPublicFormChallenge } from "@/lib/request-security"
import { getAdminLocale, getAdminMessages } from "@/lib/i18n/admin"
import { AdminLoginForm } from "@/components/admin/admin-login-form"

export default async function AdminLoginPage() {
  const session = await resolveAdminSession()
  const securityChallenge = createPublicFormChallenge("admin-login-form")

  if (session) {
    redirect("/admin/dashboard")
  }

  const locale = await getAdminLocale()
  const t = getAdminMessages(locale).login

  return (
    <section className="min-h-screen bg-background py-20">
      <div className="mx-auto max-w-md px-6">
        <div className="rounded-3xl bg-primary px-8 py-10 text-primary-foreground">
          <p className="text-sm uppercase tracking-[0.18em] text-primary-foreground/70">{t.eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl font-bold">{t.title}</h1>
          <p className="mt-3 text-sm text-primary-foreground/80">{t.intro}</p>
        </div>

        <div className="mt-6">
          <AdminLoginForm securityChallenge={securityChallenge} locale={locale} />
        </div>
      </div>
    </section>
  )
}

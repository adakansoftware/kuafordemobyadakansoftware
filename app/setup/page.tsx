import { db } from "@/lib/db"
import { createPublicFormChallenge } from "@/lib/request-security"
import { SetupWizardForm } from "@/components/setup-wizard-form"

export const dynamic = "force-dynamic"

export default async function SetupPage() {
  const existingSetup = await db.tenant
    .findFirst({
      where: {
        isSetupComplete: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    })
    .catch(() => null)
  const securityChallenge = createPublicFormChallenge("setup-form")

  return (
    <section className="py-16">
      <div className="mx-auto max-w-4xl space-y-6 px-6 lg:px-8">
        <div className="rounded-3xl bg-primary px-8 py-10 text-primary-foreground">
          <p className="text-sm uppercase tracking-[0.18em] text-primary-foreground/70">Setup</p>
          <h1 className="mt-3 font-serif text-4xl font-bold">Salon Kurulum Sihirbazi</h1>
          <p className="mt-3 text-sm text-primary-foreground/80">
            Ilk kurulumda salon adi, ekip, hizmetler ve owner kullanicisi olusturulur. Demo veri ile production tenant ayrimi burada netlesir.
          </p>
        </div>

        {!existingSetup ? (
          <SetupWizardForm securityChallenge={securityChallenge} />
        ) : (
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <p className="text-sm font-medium text-foreground">Kurulum kilitli</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Aktif tenant kurulumu tamamlanmis gorunuyor. Guvenlik nedeniyle setup sihirbazi yeniden acik degil.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

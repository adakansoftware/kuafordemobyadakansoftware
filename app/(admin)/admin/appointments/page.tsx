import { AppointmentOperations } from "@/components/admin/appointment-operations"
import { getBusinessSettings, listAppointments, listStaffFromDb } from "@/lib/bookings-repository"
import { getDailyCalendarView } from "@/lib/salon-ops-repository"
import { requireAdminAccess } from "@/lib/security"

type AppointmentsPageProps = {
  searchParams?: Promise<{
    q?: string
    status?: string
    staff?: string
    day?: string
  }>
}

export default async function AdminAppointmentsPage({ searchParams }: AppointmentsPageProps) {
  const access = await requireAdminAccess()
  const params = (await searchParams) ?? {}
  const [settings, staff, appointments, calendarView] = await Promise.all([
    getBusinessSettings(),
    listStaffFromDb(),
    listAppointments(
      {
        search: (params.q ?? "").trim(),
        status:
          params.status === "NEW" || params.status === "CONFIRMED" || params.status === "COMPLETED" || params.status === "CANCELLED"
            ? params.status
            : "ALL",
        staffId: (params.staff ?? "all").trim() || "all",
      },
      { page: 1, pageSize: 30 },
      { accessContext: access }
    ),
    getDailyCalendarView(
      params.day && /^\d{4}-\d{2}-\d{2}$/.test(params.day)
        ? params.day
        : new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date()),
      { accessContext: access }
    ),
  ])

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl space-y-6 px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-serif text-3xl font-bold text-foreground">Randevular</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Mevcut randevu akisi korunur; tenant ve rol izolasyonu ile ayni ekran uzerinden yonetilir.
          </p>
        </div>

        <div className="space-y-4">
          {appointments.items.map((appointment) => (
            <AppointmentOperations
              key={appointment.id}
              appointment={appointment}
              businessName={settings?.businessName ?? "Adakan Hair Studio"}
              staffOptions={staff.map((person) => ({
                id: person.id,
                name: person.name,
                role: person.role,
              }))}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-serif text-2xl font-bold text-foreground">Gunluk Takvim</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {calendarView.appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-xl border border-border/80 bg-secondary/20 p-4">
                <div className="font-medium text-foreground">{appointment.customer.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {appointment.scheduledTime} / {appointment.service.title}
                </div>
                <div className="text-sm text-muted-foreground">{appointment.staff?.name ?? "Atanmamis"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

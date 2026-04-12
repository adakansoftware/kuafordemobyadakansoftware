import { AppointmentSource, AppointmentStatus } from "@prisma/client"
import { type BookingFormValues } from "@/lib/booking"
import { db } from "@/lib/db"

export async function createAppointmentFromWeb(input: BookingFormValues) {
  const customer = await findOrCreateCustomer({
    name: input.name,
    email: input.email,
    phone: input.phone,
  })

  const service = await db.service.findUniqueOrThrow({
    where: { slug: input.service },
  })

  return db.appointment.create({
    data: {
      customerId: customer.id,
      serviceId: service.id,
      status: AppointmentStatus.NEW,
      source: AppointmentSource.WEB,
      scheduledAt: createScheduledAt(input.date, input.time),
      scheduledDate: input.date,
      scheduledTime: input.time,
    },
    include: {
      customer: true,
      service: true,
      staff: true,
    },
  })
}

export async function listAppointments() {
  return db.appointment.findMany({
    include: {
      customer: true,
      service: true,
      staff: true,
    },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
  })
}

export async function getAppointmentMetrics() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date())

  const [
    totalAppointments,
    todaysAppointments,
    newAppointments,
    confirmedAppointments,
    completedAppointments,
  ] = await Promise.all([
    db.appointment.count(),
    db.appointment.count({ where: { scheduledDate: today } }),
    db.appointment.count({ where: { status: AppointmentStatus.NEW } }),
    db.appointment.count({ where: { status: AppointmentStatus.CONFIRMED } }),
    db.appointment.count({ where: { status: AppointmentStatus.COMPLETED } }),
  ])

  return {
    totalAppointments,
    todaysAppointments,
    newAppointments,
    confirmedAppointments,
    completedAppointments,
  }
}

export async function listServicesFromDb() {
  return db.service.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { priceFrom: "asc" }],
  })
}

export async function listStaffFromDb() {
  return db.staff.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
}

export async function getBusinessSettings() {
  return db.businessSettings.findFirst()
}

async function findOrCreateCustomer(input: {
  name: string
  email: string
  phone: string
}) {
  const existingByEmail = await db.customer.findUnique({
    where: { email: input.email },
  })

  if (existingByEmail) {
    return db.customer.update({
      where: { id: existingByEmail.id },
      data: input,
    })
  }

  const existingByPhone = await db.customer.findUnique({
    where: { phone: input.phone },
  })

  if (existingByPhone) {
    return db.customer.update({
      where: { id: existingByPhone.id },
      data: input,
    })
  }

  return db.customer.create({
    data: input,
  })
}

function createScheduledAt(date: string, time: string) {
  return new Date(`${date}T${time}:00+03:00`)
}

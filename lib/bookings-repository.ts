import { AppointmentSource, AppointmentStatus } from "@prisma/client"
import { type BookingFormValues } from "@/lib/booking"
import { db } from "@/lib/db"

const ACTIVE_APPOINTMENT_STATUSES = [AppointmentStatus.NEW, AppointmentStatus.CONFIRMED] as const

export class AppointmentConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AppointmentConflictError"
  }
}

export async function createAppointmentFromWeb(input: BookingFormValues) {
  const service = await db.service.findUniqueOrThrow({
    where: { slug: input.service },
  })

  const customer = await findOrCreateCustomer({
    name: input.name,
    email: input.email,
    phone: input.phone,
  })

  await ensureCustomerDoesNotHaveDuplicateSlot({
    customerId: customer.id,
    scheduledDate: input.date,
    scheduledTime: input.time,
  })

  await ensurePublicSlotCapacity({
    scheduledDate: input.date,
    scheduledTime: input.time,
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
    include: appointmentInclude,
  })
}

export async function listAppointments() {
  return db.appointment.findMany({
    include: appointmentInclude,
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
  })
}

export async function getAppointmentMetrics() {
  const today = getTodayInIstanbul()

  const [
    totalAppointments,
    todaysAppointments,
    newAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
  ] = await Promise.all([
    db.appointment.count(),
    db.appointment.count({ where: { scheduledDate: today } }),
    db.appointment.count({ where: { status: AppointmentStatus.NEW } }),
    db.appointment.count({ where: { status: AppointmentStatus.CONFIRMED } }),
    db.appointment.count({ where: { status: AppointmentStatus.COMPLETED } }),
    db.appointment.count({ where: { status: AppointmentStatus.CANCELLED } }),
  ])

  return {
    totalAppointments,
    todaysAppointments,
    newAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
  }
}

export async function getOperationalAlerts() {
  const today = getTodayInIstanbul()

  const [unassignedActiveAppointments, staleRequests, todaysLoad, activeStaffCount] = await Promise.all([
    db.appointment.count({
      where: {
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
        staffId: null,
      },
    }),
    db.appointment.count({
      where: {
        status: AppointmentStatus.NEW,
        createdAt: {
          lt: new Date(Date.now() - 1000 * 60 * 30),
        },
      },
    }),
    db.appointment.count({
      where: {
        scheduledDate: today,
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      },
    }),
    db.staff.count({
      where: { isActive: true },
    }),
  ])

  return {
    unassignedActiveAppointments,
    staleRequests,
    todaysLoad,
    activeStaffCount,
    todayCapacity: Math.max(activeStaffCount, 1) * 22,
  }
}

export async function getStaffWorkload() {
  const staff = await db.staff.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      appointments: {
        where: {
          status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
          scheduledDate: {
            gte: getTodayInIstanbul(),
          },
        },
      },
    },
  })

  return staff.map((person) => ({
    id: person.id,
    name: person.name,
    role: person.role,
    activeAppointments: person.appointments.length,
  }))
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

export async function updateAppointmentFromAdmin(input: {
  appointmentId: string
  status: AppointmentStatus
  staffId?: string | null
  notes?: string
}) {
  const appointment = await db.appointment.findUniqueOrThrow({
    where: { id: input.appointmentId },
    include: appointmentInclude,
  })

  const normalizedStaffId = input.staffId?.trim() ? input.staffId : null
  const normalizedNotes = input.notes?.trim() ? input.notes.trim() : null

  if (normalizedStaffId) {
    await ensureStaffAvailability({
      appointmentId: appointment.id,
      staffId: normalizedStaffId,
      scheduledDate: appointment.scheduledDate,
      scheduledTime: appointment.scheduledTime,
      nextStatus: input.status,
    })
  }

  const updated = await db.appointment.update({
    where: { id: appointment.id },
    data: {
      status: input.status,
      staffId: normalizedStaffId,
      notes: normalizedNotes,
    },
    include: appointmentInclude,
  })

  return updated
}

async function ensureCustomerDoesNotHaveDuplicateSlot(input: {
  customerId: string
  scheduledDate: string
  scheduledTime: string
}) {
  const duplicate = await db.appointment.findFirst({
    where: {
      customerId: input.customerId,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
    },
  })

  if (duplicate) {
    throw new AppointmentConflictError("Bu musteri icin ayni tarih ve saate zaten aktif bir randevu bulunuyor.")
  }
}

async function ensurePublicSlotCapacity(input: {
  scheduledDate: string
  scheduledTime: string
}) {
  const [activeStaffCount, bookedCount] = await Promise.all([
    db.staff.count({
      where: { isActive: true },
    }),
    db.appointment.count({
      where: {
        scheduledDate: input.scheduledDate,
        scheduledTime: input.scheduledTime,
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      },
    }),
  ])

  const slotCapacity = Math.max(activeStaffCount, 1)

  if (bookedCount >= slotCapacity) {
    throw new AppointmentConflictError(
      "Sectiginiz saat dolu gorunuyor. Lutfen yakindaki baska bir saat secin."
    )
  }
}

async function ensureStaffAvailability(input: {
  appointmentId: string
  staffId: string
  scheduledDate: string
  scheduledTime: string
  nextStatus: AppointmentStatus
}) {
  if (!isActiveAppointmentStatus(input.nextStatus)) {
    return
  }

  const conflictingAppointment = await db.appointment.findFirst({
    where: {
      id: { not: input.appointmentId },
      staffId: input.staffId,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
    },
    include: {
      customer: true,
    },
  })

  if (conflictingAppointment) {
    throw new AppointmentConflictError(
      `${conflictingAppointment.customer.name} icin ayni saat araliginda bu personele aktif bir randevu zaten atanmis.`
    )
  }
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

function getTodayInIstanbul() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date())
}

function isActiveAppointmentStatus(status: AppointmentStatus) {
  return status === AppointmentStatus.NEW || status === AppointmentStatus.CONFIRMED
}

const appointmentInclude = {
  customer: true,
  service: true,
  staff: true,
} as const

import { AppointmentSource, AppointmentStatus, Prisma } from "@prisma/client"
import { bookingTimeSlots, type BookingFormValues } from "@/lib/booking"
import { db } from "@/lib/db"

const ACTIVE_APPOINTMENT_STATUSES = [AppointmentStatus.NEW, AppointmentStatus.CONFIRMED] as const

export type AppointmentListFilters = {
  search?: string
  status?: "ALL" | AppointmentStatus
  staffId?: string
}

export class AppointmentConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AppointmentConflictError"
  }
}

export async function createAppointmentFromWeb(input: BookingFormValues) {
  try {
    return await db.$transaction(
      async (tx) => {
        await lockAppointmentSlot(tx, input.date, input.time)

        const service = await tx.service.findFirstOrThrow({
          where: {
            slug: input.service,
            isActive: true,
          },
        })

        const customer = await findOrCreateCustomer(tx, {
          name: input.name,
          email: input.email,
          phone: input.phone,
        })

        await ensureCustomerDoesNotHaveDuplicateSlot(tx, {
          customerId: customer.id,
          scheduledDate: input.date,
          scheduledTime: input.time,
          durationMinutes: service.durationMinutes,
        })

        await ensurePublicSlotCapacity(tx, {
          scheduledDate: input.date,
          scheduledTime: input.time,
          durationMinutes: service.durationMinutes,
        })

        return tx.appointment.create({
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
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    )
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" || error.code === "P2002")
    ) {
      throw new AppointmentConflictError(
        "Seçtiğiniz saat için eş zamanlı yoğunluk oluştu. Lütfen yakındaki başka bir saat deneyin."
      )
    }

    throw error
  }
}

export async function listAppointments(filters: AppointmentListFilters = {}) {
  return db.appointment.findMany({
    where: buildAppointmentWhere(filters),
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

export async function getCustomerInsights() {
  const customers = await db.customer.findMany({
    include: {
      appointments: {
        include: {
          service: true,
          staff: true,
        },
        orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 6,
  })

  return customers.map((customer) => {
    const latestAppointment = customer.appointments[0] ?? null
    const totalAppointments = customer.appointments.length
    const completedAppointments = customer.appointments.filter(
      (appointment) => appointment.status === AppointmentStatus.COMPLETED
    ).length
    const activeAppointments = customer.appointments.filter((appointment) =>
      isActiveAppointmentStatus(appointment.status)
    ).length

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      totalAppointments,
      completedAppointments,
      activeAppointments,
      latestAppointment: latestAppointment
        ? {
            id: latestAppointment.id,
            status: latestAppointment.status,
            scheduledDate: latestAppointment.scheduledDate,
            scheduledTime: latestAppointment.scheduledTime,
            serviceTitle: latestAppointment.service.title,
            staffName: latestAppointment.staff?.name ?? null,
          }
        : null,
    }
  })
}

export async function getServicePerformance() {
  const services = await db.service.findMany({
    where: { isActive: true },
    include: {
      appointments: true,
    },
    orderBy: [{ sortOrder: "asc" }, { priceFrom: "asc" }],
  })

  return services.map((service) => {
    const totalAppointments = service.appointments.length
    const activeAppointments = service.appointments.filter((appointment) =>
      isActiveAppointmentStatus(appointment.status)
    ).length
    const completedAppointments = service.appointments.filter(
      (appointment) => appointment.status === AppointmentStatus.COMPLETED
    ).length
    const estimatedRevenue = completedAppointments * service.priceFrom

    return {
      id: service.id,
      title: service.title,
      teaser: service.teaser,
      totalAppointments,
      activeAppointments,
      completedAppointments,
      estimatedRevenue,
      durationMinutes: service.durationMinutes,
      priceLabel: service.priceLabel,
    }
  })
}

export async function getUpcomingAgenda(limit = 8) {
  const today = getTodayInIstanbul()

  return db.appointment.findMany({
    where: {
      scheduledDate: {
        gte: today,
      },
      status: {
        in: [...ACTIVE_APPOINTMENT_STATUSES],
      },
    },
    include: appointmentInclude,
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    take: limit,
  })
}

export async function getFollowUpQueue() {
  const [needsAssignment, needsConfirmation, completedToday] = await Promise.all([
    db.appointment.findMany({
      where: {
        staffId: null,
        status: {
          in: [...ACTIVE_APPOINTMENT_STATUSES],
        },
      },
      include: appointmentInclude,
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
      take: 4,
    }),
    db.appointment.findMany({
      where: {
        status: AppointmentStatus.NEW,
      },
      include: appointmentInclude,
      orderBy: [{ createdAt: "asc" }],
      take: 4,
    }),
    db.appointment.findMany({
      where: {
        status: AppointmentStatus.COMPLETED,
        scheduledDate: getTodayInIstanbul(),
      },
      include: appointmentInclude,
      orderBy: [{ updatedAt: "desc" }],
      take: 4,
    }),
  ])

  return [
    ...needsAssignment.map((appointment) => ({
      id: `assign-${appointment.id}`,
      tone: "warning" as const,
      title: "Personel ataması bekliyor",
      description: `${appointment.customer.name} / ${appointment.service.title} / ${appointment.scheduledDate} ${appointment.scheduledTime}`,
    })),
    ...needsConfirmation.map((appointment) => ({
      id: `confirm-${appointment.id}`,
      tone: "accent" as const,
      title: "Müşteri onayı bekliyor",
      description: `${appointment.customer.name} için yeni talep / ${appointment.scheduledDate} ${appointment.scheduledTime}`,
    })),
    ...completedToday.map((appointment) => ({
      id: `review-${appointment.id}`,
      tone: "success" as const,
      title: "Memnuniyet takibi hazır",
      description: `${appointment.customer.name} için tamamlanan hizmet / ${appointment.service.title}`,
    })),
  ].slice(0, 8)
}

export async function listServicesFromDb() {
  return db.service.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { priceFrom: "asc" }],
  })
}

export async function getPublicAvailabilityByDate(date: string) {
  const [activeStaffCount, bookings] = await Promise.all([
    db.staff.count({
      where: { isActive: true },
    }),
    db.appointment.groupBy({
      by: ["scheduledTime"],
      where: {
        scheduledDate: date,
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      },
      _count: {
        scheduledTime: true,
      },
    }),
  ])

  const capacity = Math.max(activeStaffCount, 1)
  const bookedMap = new Map(bookings.map((item) => [item.scheduledTime, item._count.scheduledTime]))

  return {
    date,
    capacity,
    slots: bookingTimeSlots.map((time) => {
      const booked = bookedMap.get(time) ?? 0

      return {
        time,
        booked,
        available: Math.max(capacity - booked, 0),
        isAvailable: booked < capacity,
      }
    }),
  }
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
  return db.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUniqueOrThrow({
      where: { id: input.appointmentId },
      include: appointmentInclude,
    })

    await lockAppointmentSlot(tx, appointment.scheduledDate, appointment.scheduledTime)

    const normalizedStaffId = input.staffId?.trim() ? input.staffId : null
    const normalizedNotes = input.notes?.trim() ? input.notes.trim() : null

    if (normalizedStaffId) {
      await ensureStaffIsActive(normalizedStaffId)
      await ensureStaffAvailability({
        appointmentId: appointment.id,
        staffId: normalizedStaffId,
        scheduledDate: appointment.scheduledDate,
        scheduledTime: appointment.scheduledTime,
        durationMinutes: appointment.service.durationMinutes,
        nextStatus: input.status,
      })
    }

    return tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: input.status,
        staffId: normalizedStaffId,
        notes: normalizedNotes,
      },
      include: appointmentInclude,
    })
  })
}

async function ensureCustomerDoesNotHaveDuplicateSlot(
  client: Prisma.TransactionClient,
  input: {
    customerId: string
    scheduledDate: string
    scheduledTime: string
    durationMinutes: number
  }
) {
  const appointments = await client.appointment.findMany({
    where: {
      customerId: input.customerId,
      scheduledDate: input.scheduledDate,
      status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
    },
    include: {
      service: {
        select: {
          durationMinutes: true,
        },
      },
    },
  })

  const hasConflict = appointments.some((appointment) =>
    hasAppointmentOverlap(
      input.scheduledDate,
      input.scheduledTime,
      input.durationMinutes,
      appointment.scheduledDate,
      appointment.scheduledTime,
      appointment.service.durationMinutes
    )
  )

  if (hasConflict) {
    throw new AppointmentConflictError("Bu müşteri için aynı zaman aralığında zaten aktif bir randevu bulunuyor.")
  }
}

async function ensurePublicSlotCapacity(
  client: Prisma.TransactionClient,
  input: {
    scheduledDate: string
    scheduledTime: string
    durationMinutes: number
  }
) {
  const [activeStaffCount, appointments] = await Promise.all([
    client.staff.count({
      where: { isActive: true },
    }),
    client.appointment.findMany({
      where: {
        scheduledDate: input.scheduledDate,
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      },
      include: {
        service: {
          select: {
            durationMinutes: true,
          },
        },
      },
    }),
  ])

  const slotCapacity = Math.max(activeStaffCount, 1)
  const overlappingCount = appointments.filter((appointment) =>
    hasAppointmentOverlap(
      input.scheduledDate,
      input.scheduledTime,
      input.durationMinutes,
      appointment.scheduledDate,
      appointment.scheduledTime,
      appointment.service.durationMinutes
    )
  ).length

  if (overlappingCount >= slotCapacity) {
    throw new AppointmentConflictError(
      "Seçtiğiniz saat dolu görünüyor. Lütfen yakındaki başka bir saat seçin."
    )
  }
}

async function ensureStaffAvailability(input: {
  appointmentId: string
  staffId: string
  scheduledDate: string
  scheduledTime: string
  durationMinutes: number
  nextStatus: AppointmentStatus
}) {
  if (!isActiveAppointmentStatus(input.nextStatus)) {
    return
  }

  const appointments = await db.appointment.findMany({
    where: {
      id: { not: input.appointmentId },
      staffId: input.staffId,
      scheduledDate: input.scheduledDate,
      status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
    },
    include: {
      customer: true,
      service: {
        select: {
          durationMinutes: true,
        },
      },
    },
  })

  const conflict = appointments.find((appointment) =>
    hasAppointmentOverlap(
      input.scheduledDate,
      input.scheduledTime,
      input.durationMinutes,
      appointment.scheduledDate,
      appointment.scheduledTime,
      appointment.service.durationMinutes
    )
  )

  if (conflict) {
    throw new AppointmentConflictError(
      `${conflict.customer.name} için aynı zaman aralığında bu personele aktif bir randevu zaten atanmış.`
    )
  }
}

async function lockAppointmentSlot(
  client: Prisma.TransactionClient,
  scheduledDate: string,
  scheduledTime: string
) {
  await client.$queryRaw`
    SELECT pg_advisory_xact_lock(hashtext(${scheduledDate}), hashtext(${scheduledTime}))
  `
}

async function ensureStaffIsActive(staffId: string) {
  const staff = await db.staff.findUnique({
    where: { id: staffId },
    select: { id: true, isActive: true },
  })

  if (!staff?.isActive) {
    throw new AppointmentConflictError("Seçilen personel şu anda aktif görünmüyor.")
  }
}

async function findOrCreateCustomer(
  client: Prisma.TransactionClient,
  input: {
    name: string
    email: string
    phone: string
  }
) {
  const existingByEmail = await client.customer.findUnique({
    where: { email: input.email },
  })

  if (existingByEmail) {
    return client.customer.update({
      where: { id: existingByEmail.id },
      data: input,
    })
  }

  const existingByPhone = await client.customer.findUnique({
    where: { phone: input.phone },
  })

  if (existingByPhone) {
    return client.customer.update({
      where: { id: existingByPhone.id },
      data: input,
    })
  }

  return client.customer.create({
    data: input,
  })
}

function buildAppointmentWhere(filters: AppointmentListFilters): Prisma.AppointmentWhereInput {
  const search = filters.search?.trim()
  const conditions: Prisma.AppointmentWhereInput[] = []

  if (filters.status && filters.status !== "ALL") {
    conditions.push({
      status: filters.status,
    })
  }

  if (filters.staffId && filters.staffId !== "all") {
    if (filters.staffId === "unassigned") {
      conditions.push({
        staffId: null,
      })
    } else {
      conditions.push({
        staffId: filters.staffId,
      })
    }
  }

  if (search) {
    conditions.push({
      OR: [
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { email: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search, mode: "insensitive" } } },
        { service: { title: { contains: search, mode: "insensitive" } } },
      ],
    })
  }

  if (!conditions.length) {
    return {}
  }

  return {
    AND: conditions,
  }
}

function createScheduledAt(date: string, time: string) {
  return new Date(`${date}T${time}:00+03:00`)
}

function getScheduledRange(date: string, time: string, durationMinutes: number) {
  const start = createScheduledAt(date, time)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)

  return { start, end }
}

function hasAppointmentOverlap(
  leftDate: string,
  leftTime: string,
  leftDurationMinutes: number,
  rightDate: string,
  rightTime: string,
  rightDurationMinutes: number
) {
  const left = getScheduledRange(leftDate, leftTime, leftDurationMinutes)
  const right = getScheduledRange(rightDate, rightTime, rightDurationMinutes)

  return left.start < right.end && right.start < left.end
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

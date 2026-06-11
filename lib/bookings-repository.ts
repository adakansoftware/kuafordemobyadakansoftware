import { AppointmentSource, AppointmentStatus, AuditActorType, AuditEvent, Prisma } from "@prisma/client"
import { createAuditLog } from "@/lib/audit-log"
import { normalizeAppointmentPagination } from "@/lib/appointment-pagination"
import { bookingTimeSlots, type BookingFormValues } from "@/lib/booking"
import {
  findStaffScheduleConflict,
  getOverlappingSlotTimes,
  hasAppointmentWindowOverlap,
} from "@/lib/booking-rules"
import { assertMatchingCustomerIdentity, CustomerIdentityConflictError } from "@/lib/customer-identity"
import { db } from "@/lib/db"
import { calculateAvailableDiscountCount } from "@/lib/salon-ops"
import { countAvailableStaffForSlot } from "@/lib/staff-availability"
import type { AdminAccessContext } from "@/lib/admin-access"
import { getTenantContext } from "@/lib/tenant"

const ACTIVE_APPOINTMENT_STATUSES = [AppointmentStatus.NEW, AppointmentStatus.CONFIRMED] as const
const BOOKING_IDEMPOTENCY_WINDOW_MS = 2 * 60 * 1000

export type AppointmentListFilters = {
  search?: string
  status?: "ALL" | AppointmentStatus
  staffId?: string
}

type TenantScopedOptions = {
  tenantId?: string
  accessContext?: AdminAccessContext | null
}

export type AppointmentListPage = {
  items: AppointmentWithRelations[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export class AppointmentConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AppointmentConflictError"
  }
}

export type CreateAppointmentResult = {
  appointment: AppointmentWithRelations
  wasDeduplicated: boolean
}

export async function createAppointmentFromWeb(
  input: BookingFormValues,
  options: {
    requestId?: string
    ipAddress?: string
    tenantId?: string
  } = {}
) {
  const tenantId = options.tenantId ?? (await getTenantContext()).tenantId

  try {
    return await db.$transaction(
      async (tx) => {
        const service = await tx.service.findFirstOrThrow({
          where: {
            tenantId,
            slug: input.service,
            isActive: true,
          },
        })

        await lockAppointmentWindow(tx, tenantId, input.date, input.time, service.durationMinutes)

        const customer = await findOrCreateCustomer(tx, {
          tenantId,
          name: input.name,
          email: input.email,
          phone: input.phone,
        })

        const recentDuplicate = await findRecentDuplicateWebAppointment(tx, {
          customerId: customer.id,
          serviceId: service.id,
          scheduledDate: input.date,
          scheduledTime: input.time,
          tenantId,
        })

        if (recentDuplicate) {
          await createAuditLog(
            {
              actorType: AuditActorType.CUSTOMER,
              tenantId,
              actorIdentifier: customer.email ?? customer.phone ?? customer.id,
              event: AuditEvent.BOOKING_REPLAYED,
              targetType: "appointment",
              targetId: recentDuplicate.id,
              requestId: options.requestId,
              ipAddress: options.ipAddress,
              metadata: {
                serviceSlug: input.service,
                scheduledDate: input.date,
                scheduledTime: input.time,
              },
            },
            tx
          )

          return {
            appointment: recentDuplicate,
            wasDeduplicated: true,
          } satisfies CreateAppointmentResult
        }

        await ensureCustomerDoesNotHaveDuplicateSlot(tx, {
          customerId: customer.id,
          scheduledDate: input.date,
          scheduledTime: input.time,
          durationMinutes: service.durationMinutes,
          tenantId,
        })

        await ensurePublicSlotCapacity(tx, {
          tenantId,
          scheduledDate: input.date,
          scheduledTime: input.time,
          durationMinutes: service.durationMinutes,
        })

        const appointment = await tx.appointment.create({
          data: {
            tenantId,
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

        await createAuditLog(
          {
              actorType: AuditActorType.CUSTOMER,
              tenantId,
              actorIdentifier: customer.email ?? customer.phone ?? customer.id,
            event: AuditEvent.BOOKING_CREATED,
            targetType: "appointment",
            targetId: appointment.id,
            requestId: options.requestId,
            ipAddress: options.ipAddress,
            metadata: {
              serviceSlug: input.service,
              scheduledDate: input.date,
              scheduledTime: input.time,
            },
          },
          tx
        )

        return {
          appointment,
          wasDeduplicated: false,
        } satisfies CreateAppointmentResult
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    )
  } catch (error) {
    if (error instanceof CustomerIdentityConflictError) {
      throw error
    }

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

export async function listAppointments(
  filters: AppointmentListFilters = {},
  pagination?: {
    page?: number
    pageSize?: number
  },
  options: TenantScopedOptions = {}
) {
  const tenantId = options.tenantId ?? (await getTenantContext()).tenantId
  const normalizedPagination = normalizeAppointmentPagination(pagination)
  const where = buildAppointmentWhere(filters, tenantId, options.accessContext)
  const [total, items] = await Promise.all([
    db.appointment.count({ where }),
    db.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
      skip: (normalizedPagination.page - 1) * normalizedPagination.pageSize,
      take: normalizedPagination.pageSize,
    }),
  ])

  return {
    items,
    total,
    page: normalizedPagination.page,
    pageSize: normalizedPagination.pageSize,
    totalPages: Math.max(Math.ceil(total / normalizedPagination.pageSize), 1),
  } satisfies AppointmentListPage
}

export async function getAppointmentMetrics() {
  const today = getTodayInIstanbul()
  const tenantId = (await getTenantContext()).tenantId

  const [
    totalAppointments,
    todaysAppointments,
    newAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
  ] = await Promise.all([
    db.appointment.count({ where: { tenantId } }),
    db.appointment.count({ where: { tenantId, scheduledDate: today } }),
    db.appointment.count({ where: { tenantId, status: AppointmentStatus.NEW } }),
    db.appointment.count({ where: { tenantId, status: AppointmentStatus.CONFIRMED } }),
    db.appointment.count({ where: { tenantId, status: AppointmentStatus.COMPLETED } }),
    db.appointment.count({ where: { tenantId, status: AppointmentStatus.CANCELLED } }),
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
  const tenantId = (await getTenantContext()).tenantId

  const [unassignedActiveAppointments, staleRequests, todaysLoad, activeStaffCount] = await Promise.all([
    db.appointment.count({
      where: {
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
        staffId: null,
        tenantId,
      },
    }),
    db.appointment.count({
      where: {
        status: AppointmentStatus.NEW,
        tenantId,
        createdAt: {
          lt: new Date(Date.now() - 1000 * 60 * 30),
        },
      },
    }),
    db.appointment.count({
      where: {
        scheduledDate: today,
        tenantId,
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      },
    }),
    db.staff.count({
      where: { tenantId, isActive: true },
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
  const today = getTodayInIstanbul()
  const tenantId = (await getTenantContext()).tenantId
  const [staff, groupedAppointments] = await Promise.all([
    db.staff.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        role: true,
      },
    }),
    db.appointment.groupBy({
      by: ["staffId"],
      where: {
        staffId: {
          not: null,
        },
        tenantId,
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
        scheduledDate: {
          gte: today,
        },
      },
      _count: {
        _all: true,
      },
    }),
  ])

  const appointmentCountByStaffId = new Map(
    groupedAppointments
      .filter((entry): entry is typeof entry & { staffId: string } => Boolean(entry.staffId))
      .map((entry) => [entry.staffId, entry._count._all])
  )

  return staff.map((person) => ({
    id: person.id,
    name: person.name,
    role: person.role,
    activeAppointments: appointmentCountByStaffId.get(person.id) ?? 0,
  }))
}

export async function getCustomerInsights() {
  const tenantId = (await getTenantContext()).tenantId
  const customers = await db.customer.findMany({
    select: {
      tenantId: true,
      id: true,
      name: true,
      phone: true,
      email: true,
      loyaltyPoints: true,
    },
    where: {
      tenantId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 6,
  })

  const customerIds = customers.map((customer) => customer.id)

  const [groupedAppointments, latestAppointments, completedPaidAppointments] = await Promise.all([
    customerIds.length
      ? db.appointment.groupBy({
          by: ["customerId", "status"],
          where: {
            customerId: {
              in: customerIds,
            },
            tenantId,
          },
          _count: {
            _all: true,
          },
        })
      : Promise.resolve([]),
    customerIds.length
      ? db.appointment.findMany({
          where: {
            customerId: {
              in: customerIds,
            },
            tenantId,
          },
          include: {
            service: true,
            staff: true,
          },
          orderBy: [{ customerId: "asc" }, { scheduledAt: "desc" }, { createdAt: "desc" }],
        })
      : Promise.resolve([]),
    customerIds.length
      ? db.appointment.findMany({
          where: {
            customerId: {
              in: customerIds,
            },
            tenantId,
            status: AppointmentStatus.COMPLETED,
            payment: {
              isNot: null,
            },
          },
          select: {
            customerId: true,
            payment: {
              select: {
                amount: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ])

  const appointmentStatsByCustomerId = new Map<
    string,
    {
      totalAppointments: number
      completedAppointments: number
      activeAppointments: number
    }
  >()

  for (const entry of groupedAppointments) {
    const current = appointmentStatsByCustomerId.get(entry.customerId) ?? {
      totalAppointments: 0,
      completedAppointments: 0,
      activeAppointments: 0,
    }

    current.totalAppointments += entry._count._all

    if (entry.status === AppointmentStatus.COMPLETED) {
      current.completedAppointments += entry._count._all
    }

    if (isActiveAppointmentStatus(entry.status)) {
      current.activeAppointments += entry._count._all
    }

    appointmentStatsByCustomerId.set(entry.customerId, current)
  }

  const latestAppointmentByCustomerId = new Map(
    latestAppointments
      .filter((appointment, index, appointments) => appointments.findIndex((entry) => entry.customerId === appointment.customerId) === index)
      .map((appointment) => [appointment.customerId, appointment])
  )
  const completedPaidStatsByCustomerId = new Map<
    string,
    {
      completedPaidAppointments: number
      totalSpending: number
    }
  >()

  for (const appointment of completedPaidAppointments) {
    const current = completedPaidStatsByCustomerId.get(appointment.customerId) ?? {
      completedPaidAppointments: 0,
      totalSpending: 0,
    }

    current.completedPaidAppointments += 1
    current.totalSpending += appointment.payment?.amount ?? 0
    completedPaidStatsByCustomerId.set(appointment.customerId, current)
  }

  return customers.map((customer) => {
    const latestAppointment = latestAppointmentByCustomerId.get(customer.id) ?? null
    const stats = appointmentStatsByCustomerId.get(customer.id) ?? {
      totalAppointments: 0,
      completedAppointments: 0,
      activeAppointments: 0,
    }
    const paidStats = completedPaidStatsByCustomerId.get(customer.id) ?? {
      completedPaidAppointments: 0,
      totalSpending: 0,
    }

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      loyaltyPoints: customer.loyaltyPoints,
      availableDiscounts: calculateAvailableDiscountCount(paidStats.completedPaidAppointments),
      totalSpending: paidStats.totalSpending,
      totalAppointments: stats.totalAppointments,
      completedAppointments: stats.completedAppointments,
      activeAppointments: stats.activeAppointments,
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
  const tenantId = (await getTenantContext()).tenantId
  const services = await db.service.findMany({
    where: { tenantId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { priceFrom: "asc" }],
  })
  const serviceIds = services.map((service) => service.id)
  const groupedAppointments = serviceIds.length
    ? await db.appointment.groupBy({
        by: ["serviceId", "status"],
        where: {
          serviceId: {
            in: serviceIds,
          },
          tenantId,
        },
        _count: {
          _all: true,
        },
      })
    : []

  const appointmentStatsByServiceId = new Map<
    string,
    {
      totalAppointments: number
      activeAppointments: number
      completedAppointments: number
    }
  >()

  for (const entry of groupedAppointments) {
    const current = appointmentStatsByServiceId.get(entry.serviceId) ?? {
      totalAppointments: 0,
      activeAppointments: 0,
      completedAppointments: 0,
    }

    current.totalAppointments += entry._count._all

    if (isActiveAppointmentStatus(entry.status)) {
      current.activeAppointments += entry._count._all
    }

    if (entry.status === AppointmentStatus.COMPLETED) {
      current.completedAppointments += entry._count._all
    }

    appointmentStatsByServiceId.set(entry.serviceId, current)
  }

  return services.map((service) => {
    const stats = appointmentStatsByServiceId.get(service.id) ?? {
      totalAppointments: 0,
      activeAppointments: 0,
      completedAppointments: 0,
    }
    const estimatedRevenue = stats.completedAppointments * service.priceFrom

    return {
      id: service.id,
      title: service.title,
      teaser: service.teaser,
      totalAppointments: stats.totalAppointments,
      activeAppointments: stats.activeAppointments,
      completedAppointments: stats.completedAppointments,
      estimatedRevenue,
      durationMinutes: service.durationMinutes,
      priceLabel: service.priceLabel,
    }
  })
}

export async function getUpcomingAgenda(limit = 8) {
  const today = getTodayInIstanbul()
  const tenantId = (await getTenantContext()).tenantId

  return db.appointment.findMany({
    where: {
      tenantId,
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
  const tenantId = (await getTenantContext()).tenantId
  const [needsAssignment, needsConfirmation, completedToday] = await Promise.all([
    db.appointment.findMany({
      where: {
        tenantId,
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
        tenantId,
        status: AppointmentStatus.NEW,
      },
      include: appointmentInclude,
      orderBy: [{ createdAt: "asc" }],
      take: 4,
    }),
    db.appointment.findMany({
      where: {
        tenantId,
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
  const tenantId = (await getTenantContext()).tenantId
  return db.service.findMany({
    where: { tenantId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { priceFrom: "asc" }],
  })
}

export async function getPublicAvailabilityByDate(date: string) {
  const tenantId = (await getTenantContext()).tenantId
  const [staff, bookings] = await Promise.all([
    db.staff.findMany({
      where: { tenantId, isActive: true },
      include: {
        availabilities: true,
        timeOff: true,
      },
    }),
    db.appointment.findMany({
      where: {
        tenantId,
        scheduledDate: date,
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

  const normalizedBookings = bookings.map((appointment) => ({
    staffId: appointment.staffId,
    scheduledDate: appointment.scheduledDate,
    scheduledTime: appointment.scheduledTime,
    durationMinutes: appointment.service.durationMinutes,
  }))

  return {
    date,
    capacity: Math.max(staff.length, 1),
    slots: bookingTimeSlots.map((time) => {
      const available = countAvailableStaffForSlot({
        staff: staff.map((staffMember) => ({
          staffId: staffMember.id,
          isActive: staffMember.isActive,
          availabilities: staffMember.availabilities,
          timeOff: staffMember.timeOff,
        })),
        bookings: normalizedBookings,
        candidate: {
          scheduledDate: date,
          scheduledTime: time,
          durationMinutes: 30,
        },
      })

      return {
        time,
        booked: Math.max(staff.length - available, 0),
        available,
        isAvailable: available > 0,
      }
    }),
  }
}

export async function listStaffFromDb() {
  const tenantId = (await getTenantContext()).tenantId
  return db.staff.findMany({
    where: { tenantId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })
}

export async function getBusinessSettings() {
  const tenantId = (await getTenantContext()).tenantId
  return db.businessSettings.findFirst({
    where: { tenantId },
  })
}

export async function updateAppointmentFromAdmin(input: {
  appointmentId: string
  status: AppointmentStatus
  staffId?: string | null
  notes?: string
  actorIdentifier?: string | null
  requestId?: string
  ipAddress?: string
  tenantId?: string
  accessContext?: AdminAccessContext | null
}) {
  const tenantId = input.tenantId ?? (await getTenantContext()).tenantId
  try {
    return await db.$transaction(
      async (tx) => {
        const appointment = await tx.appointment.findFirstOrThrow({
          where: { id: input.appointmentId, tenantId },
          include: appointmentInclude,
        })

        await lockAppointmentWindow(
          tx,
          tenantId,
          appointment.scheduledDate,
          appointment.scheduledTime,
          appointment.service.durationMinutes
        )

        const normalizedStaffId = input.staffId?.trim() ? input.staffId : null
        const normalizedNotes = input.notes?.trim() ? input.notes.trim() : null

        if (normalizedStaffId) {
          await ensureStaffIsActive(tx, normalizedStaffId, tenantId)
          await ensureStaffAvailability(tx, {
            tenantId,
            appointmentId: appointment.id,
            staffId: normalizedStaffId,
            scheduledDate: appointment.scheduledDate,
            scheduledTime: appointment.scheduledTime,
            durationMinutes: appointment.service.durationMinutes,
            nextStatus: input.status,
          })
        }

        const updatedAppointment = await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            status: input.status,
            staffId: normalizedStaffId,
            notes: normalizedNotes,
          },
          include: appointmentInclude,
        })

        await createAuditLog(
          {
            actorType: AuditActorType.ADMIN,
            tenantId,
            actorIdentifier: input.actorIdentifier ?? "admin",
            event: AuditEvent.APPOINTMENT_UPDATED,
            targetType: "appointment",
            targetId: updatedAppointment.id,
            requestId: input.requestId,
            ipAddress: input.ipAddress,
            metadata: {
              previousStatus: appointment.status,
              nextStatus: updatedAppointment.status,
              previousStaffId: appointment.staffId,
              nextStaffId: updatedAppointment.staffId,
              hadNotes: Boolean(appointment.notes),
              hasNotes: Boolean(updatedAppointment.notes),
            },
          },
          tx
        )

        return updatedAppointment
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
        "Bu randevu kaydi ayni anda baska bir islem tarafindan guncellendi. Lutfen tekrar deneyin."
      )
    }

    throw error
  }
}

async function ensureCustomerDoesNotHaveDuplicateSlot(
  client: Prisma.TransactionClient,
  input: {
    tenantId: string
    customerId: string
    scheduledDate: string
    scheduledTime: string
    durationMinutes: number
  }
) {
  const appointments = await client.appointment.findMany({
    where: {
      tenantId: input.tenantId,
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
    hasAppointmentWindowOverlap(
      {
        scheduledDate: input.scheduledDate,
        scheduledTime: input.scheduledTime,
        durationMinutes: input.durationMinutes,
      },
      {
        scheduledDate: appointment.scheduledDate,
        scheduledTime: appointment.scheduledTime,
        durationMinutes: appointment.service.durationMinutes,
      }
    )
  )

  if (hasConflict) {
    throw new AppointmentConflictError("Bu müşteri için aynı zaman aralığında zaten aktif bir randevu bulunuyor.")
  }
}

async function ensurePublicSlotCapacity(
  client: Prisma.TransactionClient,
  input: {
    tenantId: string
    scheduledDate: string
    scheduledTime: string
    durationMinutes: number
  }
) {
  const [staff, appointments] = await Promise.all([
    client.staff.findMany({
      where: { tenantId: input.tenantId, isActive: true },
      include: {
        availabilities: true,
        timeOff: true,
      },
    }),
    client.appointment.findMany({
      where: {
        tenantId: input.tenantId,
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

  const availableStaffCount = countAvailableStaffForSlot({
    staff: staff.map((staffMember) => ({
      staffId: staffMember.id,
      isActive: staffMember.isActive,
      availabilities: staffMember.availabilities,
      timeOff: staffMember.timeOff,
    })),
    bookings: appointments.map((appointment) => ({
      staffId: appointment.staffId,
      scheduledDate: appointment.scheduledDate,
      scheduledTime: appointment.scheduledTime,
      durationMinutes: appointment.service.durationMinutes,
    })),
    candidate: {
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      durationMinutes: input.durationMinutes,
    },
  })

  if (availableStaffCount < 1) {
    throw new AppointmentConflictError(
      "Seçtiğiniz saat dolu görünüyor. Lütfen yakındaki başka bir saat seçin."
    )
  }
}

async function ensureStaffAvailability(
  client: Prisma.TransactionClient,
  input: {
    tenantId: string
    appointmentId: string
    staffId: string
    scheduledDate: string
    scheduledTime: string
    durationMinutes: number
    nextStatus: AppointmentStatus
  }
) {
  if (!isActiveAppointmentStatus(input.nextStatus)) {
    return
  }

  const appointments = await client.appointment.findMany({
    where: {
      id: { not: input.appointmentId },
      tenantId: input.tenantId,
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

  const conflict = findStaffScheduleConflict(
    appointments.map((appointment) => ({
      id: appointment.id,
      customer: {
        name: appointment.customer.name,
      },
      scheduledDate: appointment.scheduledDate,
      scheduledTime: appointment.scheduledTime,
      durationMinutes: appointment.service.durationMinutes,
    })),
    {
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      durationMinutes: input.durationMinutes,
    }
  )

  if (conflict) {
    throw new AppointmentConflictError(
      `${conflict.customer.name} için aynı zaman aralığında bu personele aktif bir randevu zaten atanmış.`
    )
  }
}

async function lockAppointmentWindow(
  client: Prisma.TransactionClient,
  tenantId: string,
  scheduledDate: string,
  scheduledTime: string,
  durationMinutes: number
) {
  const slotTimes = getOverlappingSlotTimes(scheduledDate, scheduledTime, durationMinutes)

  for (const slotTime of slotTimes) {
    await client.$queryRaw`
      SELECT pg_advisory_xact_lock(hashtext(${tenantId}), hashtext(${`${scheduledDate}:${slotTime}`}))
    `
  }
}

async function ensureStaffIsActive(client: Prisma.TransactionClient, staffId: string, tenantId?: string) {
  const staff = await client.staff.findFirst({
    where: { id: staffId, ...(tenantId ? { tenantId } : {}) },
    select: { id: true, isActive: true },
  })

  if (!staff?.isActive) {
    throw new AppointmentConflictError("Seçilen personel şu anda aktif görünmüyor.")
  }
}

async function findOrCreateCustomer(
  client: Prisma.TransactionClient,
  input: {
    tenantId: string
    name: string
    email: string
    phone: string
  }
) {
  const existingByEmail = await client.customer.findFirst({
    where: { tenantId: input.tenantId, email: input.email },
  })

  const existingByPhone = await client.customer.findFirst({
    where: { tenantId: input.tenantId, phone: input.phone },
  })

  assertMatchingCustomerIdentity({
    emailCustomerId: existingByEmail?.id,
    phoneCustomerId: existingByPhone?.id,
  })

  if (existingByEmail) {
    return client.customer.update({
      where: { id: existingByEmail.id },
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
      },
    })
  }

  if (existingByPhone) {
    return client.customer.update({
      where: { id: existingByPhone.id },
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
      },
    })
  }

  return client.customer.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      email: input.email,
      phone: input.phone,
    },
  })
}

async function findRecentDuplicateWebAppointment(
  client: Prisma.TransactionClient,
  input: {
    tenantId: string
    customerId: string
    serviceId: string
    scheduledDate: string
    scheduledTime: string
  }
) {
  return client.appointment.findFirst({
    where: {
      tenantId: input.tenantId,
      customerId: input.customerId,
      serviceId: input.serviceId,
      source: AppointmentSource.WEB,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      createdAt: {
        gte: new Date(Date.now() - BOOKING_IDEMPOTENCY_WINDOW_MS),
      },
    },
    include: appointmentInclude,
    orderBy: [{ createdAt: "desc" }],
  })
}

function buildAppointmentWhere(
  filters: AppointmentListFilters,
  tenantId: string,
  accessContext?: AdminAccessContext | null
): Prisma.AppointmentWhereInput {
  const search = filters.search?.trim()
  const conditions: Prisma.AppointmentWhereInput[] = [{ tenantId }]

  if (accessContext?.role === "STAFF") {
    conditions.push({
      staffId: accessContext.staffId ?? "__no_access__",
    })
  }

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
    return { tenantId }
  }

  return {
    AND: conditions,
  }
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
  payment: true,
} as const
type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude
}>

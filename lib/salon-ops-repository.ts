import { AppointmentStatus, AuditActorType, AuditEvent, PaymentMethod, Prisma } from "@prisma/client"
import { createAuditLog } from "@/lib/audit-log"
import { db } from "@/lib/db"
import {
  buildAppointmentWhatsAppMessages,
  calculateAvailableDiscountCount,
  calculateCommissionAmount,
  calculateLoyaltyPoints,
} from "@/lib/salon-ops"

export class AdminPaymentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AdminPaymentError"
  }
}

const appointmentWithPaymentInclude = {
  customer: true,
  service: true,
  staff: true,
  payment: true,
} as const

type AppointmentWithPayment = Prisma.AppointmentGetPayload<{
  include: typeof appointmentWithPaymentInclude
}>

export async function recordAppointmentPayment(input: {
  appointmentId: string
  amount: number
  method: PaymentMethod
  note?: string | null
  actorIdentifier?: string | null
  requestId?: string
  ipAddress?: string
}) {
  return db.$transaction(async (tx) => {
    const appointment = await tx.appointment.findUniqueOrThrow({
      where: { id: input.appointmentId },
      include: appointmentWithPaymentInclude,
    })

    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new AdminPaymentError("Odeme sadece tamamlanan randevular icin alinabilir.")
    }

    if (appointment.payment) {
      throw new AdminPaymentError("Bu randevu icin odeme kaydi zaten bulunuyor.")
    }

    const payment = await tx.payment.create({
      data: {
        appointmentId: appointment.id,
        amount: input.amount,
        method: input.method,
        note: input.note?.trim() ? input.note.trim() : null,
        paidAt: new Date(),
      },
    })

    const completedPaidAppointments = await tx.payment.count({
      where: {
        appointment: {
          customerId: appointment.customerId,
          status: AppointmentStatus.COMPLETED,
        },
      },
    })

    const loyaltyPoints = calculateLoyaltyPoints(completedPaidAppointments)
    const discountCount = calculateAvailableDiscountCount(completedPaidAppointments)

    await tx.customer.update({
      where: { id: appointment.customerId },
      data: {
        loyaltyPoints,
      },
    })

    await createAuditLog(
      {
        actorType: AuditActorType.ADMIN,
        actorIdentifier: input.actorIdentifier ?? "admin",
        event: AuditEvent.PAYMENT_RECORDED,
        targetType: "payment",
        targetId: payment.id,
        requestId: input.requestId,
        ipAddress: input.ipAddress,
        metadata: {
          appointmentId: appointment.id,
          amount: input.amount,
          method: input.method,
        },
      },
      tx
    )

    await createAuditLog(
      {
        actorType: AuditActorType.ADMIN,
        actorIdentifier: input.actorIdentifier ?? "admin",
        event: AuditEvent.LOYALTY_UPDATED,
        targetType: "customer",
        targetId: appointment.customerId,
        requestId: input.requestId,
        ipAddress: input.ipAddress,
        metadata: {
          loyaltyPoints,
          completedPaidAppointments,
          discountCount,
        },
      },
      tx
    )

    const commissionAmount = appointment.staff
      ? calculateCommissionAmount(input.amount, appointment.staff.commissionRate)
      : 0

    if (appointment.staff && commissionAmount > 0) {
      await createAuditLog(
        {
          actorType: AuditActorType.ADMIN,
          actorIdentifier: input.actorIdentifier ?? "admin",
          event: AuditEvent.COMMISSION_RECORDED,
          targetType: "staff",
          targetId: appointment.staff.id,
          requestId: input.requestId,
          ipAddress: input.ipAddress,
          metadata: {
            appointmentId: appointment.id,
            amount: input.amount,
            commissionRate: appointment.staff.commissionRate,
            commissionAmount,
          },
        },
        tx
      )
    }

    return {
      payment,
      appointment,
      loyaltyPoints,
      discountCount,
      commissionAmount,
    }
  })
}

export async function getUnpaidCompletedAppointments(limit = 6) {
  return db.appointment.findMany({
    where: {
      status: AppointmentStatus.COMPLETED,
      payment: null,
    },
    include: appointmentWithPaymentInclude,
    orderBy: [{ scheduledAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
  })
}

export async function getEndOfDaySummary(date = getTodayInIstanbul()) {
  const dayStart = new Date(`${date}T00:00:00+03:00`)
  const dayEnd = new Date(`${date}T23:59:59.999+03:00`)

  const [payments, unpaidCompletedAppointments, totalTodayAppointments, completedTodayAppointments, cancelledTodayAppointments] =
    await Promise.all([
      db.payment.findMany({
        where: {
          paidAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        include: {
          appointment: {
            include: {
              service: true,
              staff: true,
            },
          },
        },
      }),
      db.appointment.findMany({
        where: {
          scheduledDate: date,
          status: AppointmentStatus.COMPLETED,
          payment: null,
        },
        include: {
          service: true,
        },
      }),
      db.appointment.count({
        where: { scheduledDate: date },
      }),
      db.appointment.count({
        where: { scheduledDate: date, status: AppointmentStatus.COMPLETED },
      }),
      db.appointment.count({
        where: { scheduledDate: date, status: AppointmentStatus.CANCELLED },
      }),
    ])

  let revenueTotal = 0
  let cashTotal = 0
  let cardTotal = 0
  let ibanTotal = 0
  let otherTotal = 0
  const serviceRevenue = new Map<string, { title: string; revenue: number }>()
  const staffLoad = new Map<string, { name: string; completedAppointments: number }>()

  for (const payment of payments) {
    revenueTotal += payment.amount

    if (payment.method === PaymentMethod.CASH) {
      cashTotal += payment.amount
    } else if (payment.method === PaymentMethod.CARD) {
      cardTotal += payment.amount
    } else if (payment.method === PaymentMethod.IBAN) {
      ibanTotal += payment.amount
    } else {
      otherTotal += payment.amount
    }

    const serviceEntry = serviceRevenue.get(payment.appointment.serviceId) ?? {
      title: payment.appointment.service.title,
      revenue: 0,
    }
    serviceEntry.revenue += payment.amount
    serviceRevenue.set(payment.appointment.serviceId, serviceEntry)

    if (payment.appointment.staff) {
      const staffEntry = staffLoad.get(payment.appointment.staff.id) ?? {
        name: payment.appointment.staff.name,
        completedAppointments: 0,
      }
      staffEntry.completedAppointments += 1
      staffLoad.set(payment.appointment.staff.id, staffEntry)
    }
  }

  const pendingPaymentAmount = unpaidCompletedAppointments.reduce(
    (total, appointment) => total + appointment.service.priceFrom,
    0
  )

  const topService = Array.from(serviceRevenue.values()).sort((left, right) => right.revenue - left.revenue)[0] ?? null
  const topStaff = Array.from(staffLoad.values()).sort(
    (left, right) => right.completedAppointments - left.completedAppointments
  )[0] ?? null

  return {
    revenueTotal,
    cashTotal,
    cardTotal,
    ibanTotal,
    otherTotal,
    pendingPaymentAmount,
    pendingPaymentCount: unpaidCompletedAppointments.length,
    completedAppointments: completedTodayAppointments,
    cancelRate: totalTodayAppointments ? Math.round((cancelledTodayAppointments / totalTodayAppointments) * 100) : 0,
    topService,
    topStaff,
    date,
  }
}

export async function getStaffCommissionSummary() {
  const staff = await db.staff.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })

  const payments = await db.payment.findMany({
    where: {
      appointment: {
        status: AppointmentStatus.COMPLETED,
        staffId: {
          not: null,
        },
      },
    },
    include: {
      appointment: {
        include: {
          staff: true,
        },
      },
    },
  })

  const summaryByStaffId = new Map<
    string,
    {
      totalAppointments: number
      totalRevenue: number
      estimatedCommission: number
    }
  >()

  for (const payment of payments) {
    const staffMember = payment.appointment.staff

    if (!staffMember) {
      continue
    }

    const current = summaryByStaffId.get(staffMember.id) ?? {
      totalAppointments: 0,
      totalRevenue: 0,
      estimatedCommission: 0,
    }

    current.totalAppointments += 1
    current.totalRevenue += payment.amount
    current.estimatedCommission += calculateCommissionAmount(payment.amount, staffMember.commissionRate)
    summaryByStaffId.set(staffMember.id, current)
  }

  return staff.map((staffMember) => {
    const summary = summaryByStaffId.get(staffMember.id) ?? {
      totalAppointments: 0,
      totalRevenue: 0,
      estimatedCommission: 0,
    }

    return {
      id: staffMember.id,
      name: staffMember.name,
      role: staffMember.role,
      commissionRate: staffMember.commissionRate,
      totalAppointments: summary.totalAppointments,
      totalRevenue: summary.totalRevenue,
      estimatedCommission: summary.estimatedCommission,
    }
  })
}

export async function getActivePackages() {
  return db.package.findMany({
    where: { isActive: true },
    include: {
      packageServices: {
        include: {
          service: true,
        },
        orderBy: [{ sortOrder: "asc" }],
      },
    },
    orderBy: [{ name: "asc" }],
  })
}

export async function getDailyCalendarView(date = getTodayInIstanbul()) {
  const [staff, appointments] = await Promise.all([
    db.staff.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.appointment.findMany({
      where: { scheduledDate: date },
      include: appointmentWithPaymentInclude,
      orderBy: [{ scheduledTime: "asc" }, { createdAt: "asc" }],
    }),
  ])

  return {
    date,
    staff,
    appointments,
  }
}

export async function updateBusinessSettings(input: {
  businessName: string
  tagline: string
  phone: string
  whatsappPhone: string
  email: string
  address: string
  city: string
  currency: string
  dailyCapacity: number
  workingHoursNote?: string
  actorIdentifier?: string | null
  requestId?: string
  ipAddress?: string
}) {
  const existing = await db.businessSettings.findFirst()
  const workingHours = input.workingHoursNote?.trim() ? { note: input.workingHoursNote.trim() } : Prisma.JsonNull

  const settings = existing
    ? await db.businessSettings.update({
        where: { id: existing.id },
        data: {
          businessName: input.businessName,
          tagline: input.tagline,
          phone: input.phone,
          whatsappPhone: input.whatsappPhone,
          email: input.email,
          address: input.address,
          city: input.city,
          currency: input.currency,
          dailyCapacity: input.dailyCapacity,
          workingHours,
        },
      })
    : await db.businessSettings.create({
        data: {
          businessName: input.businessName,
          tagline: input.tagline,
          phone: input.phone,
          whatsappPhone: input.whatsappPhone,
          email: input.email,
          address: input.address,
          city: input.city,
          timezone: "Europe/Istanbul",
          currency: input.currency,
          dailyCapacity: input.dailyCapacity,
          workingHours,
        },
      })

  await createAuditLog({
    actorType: AuditActorType.ADMIN,
    actorIdentifier: input.actorIdentifier ?? "admin",
    event: AuditEvent.BUSINESS_SETTINGS_UPDATED,
    targetType: "business_settings",
    targetId: settings.id,
    requestId: input.requestId,
    ipAddress: input.ipAddress,
    metadata: {
      businessName: settings.businessName,
      currency: settings.currency,
      dailyCapacity: settings.dailyCapacity,
    },
  })

  return settings
}

export async function updateCustomerNotes(input: {
  customerId: string
  notes: string
  actorIdentifier?: string | null
  requestId?: string
  ipAddress?: string
}) {
  const customer = await db.customer.update({
    where: { id: input.customerId },
    data: {
      notes: input.notes.trim() || null,
    },
  })

  await createAuditLog({
    actorType: AuditActorType.ADMIN,
    actorIdentifier: input.actorIdentifier ?? "admin",
    event: AuditEvent.CUSTOMER_UPDATED,
    targetType: "customer",
    targetId: customer.id,
    requestId: input.requestId,
    ipAddress: input.ipAddress,
    metadata: {
      hasNotes: Boolean(customer.notes),
      loyaltyPoints: customer.loyaltyPoints,
    },
  })

  return customer
}

export async function getCustomerDetail(customerId: string) {
  const customer = await db.customer.findUniqueOrThrow({
    where: { id: customerId },
    include: {
      appointments: {
        include: appointmentWithPaymentInclude,
        orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
      },
    },
  })

  const completedPaidAppointments = customer.appointments.filter(
    (appointment) => appointment.status === AppointmentStatus.COMPLETED && appointment.payment
  )
  const totalSpending = completedPaidAppointments.reduce(
    (total, appointment) => total + (appointment.payment?.amount ?? 0),
    0
  )
  const cancellationCount = customer.appointments.filter(
    (appointment) => appointment.status === AppointmentStatus.CANCELLED
  ).length
  const lastVisit = customer.appointments.find((appointment) => appointment.status === AppointmentStatus.COMPLETED) ?? null
  const discountCount = calculateAvailableDiscountCount(completedPaidAppointments.length)

  return {
    customer,
    totalSpending,
    cancellationCount,
    lastVisit,
    completedPaidAppointments: completedPaidAppointments.length,
    discountCount,
  }
}

export function buildAppointmentWhatsAppLinks(input: {
  appointment: AppointmentWithPayment
  businessName: string
}) {
  return buildAppointmentWhatsAppMessages({
    customerName: input.appointment.customer.name,
    scheduledDate: input.appointment.scheduledDate,
    scheduledTime: input.appointment.scheduledTime,
    serviceTitle: input.appointment.service.title,
    businessName: input.businessName,
  })
}

function getTodayInIstanbul() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date())
}

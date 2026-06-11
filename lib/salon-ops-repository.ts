import {
  AdminUserRole,
  AppointmentStatus,
  AuditActorType,
  AuditEvent,
  CancellationRequestStatus,
  PaymentMethod,
  Prisma,
  SubscriptionPlan,
  TenantMode,
} from "@prisma/client"
import { createAuditLog } from "@/lib/audit-log"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import {
  buildAppointmentWhatsAppMessages,
  calculateAvailableDiscountCount,
  calculateCommissionAmount,
  calculateLoyaltyPoints,
  LOYALTY_POINTS_PER_PAID_APPOINTMENT,
} from "@/lib/salon-ops"
import type { AdminAccessContext } from "@/lib/admin-access"
import { canViewSettings, getPlanLimits } from "@/lib/admin-access"
import { getTenantContext } from "@/lib/tenant"

export class AdminPaymentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AdminPaymentError"
  }
}

export class SubscriptionFeatureError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SubscriptionFeatureError"
  }
}

export class CustomerPortalAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CustomerPortalAccessError"
  }
}

const appointmentWithPaymentInclude = {
  customer: true,
  service: true,
  staff: true,
  payment: true,
  cancellationRequests: true,
} as const

type AppointmentWithPayment = Prisma.AppointmentGetPayload<{
  include: typeof appointmentWithPaymentInclude
}>

async function resolveTenantId(tenantId?: string) {
  return tenantId ?? (await getTenantContext()).tenantId
}

async function getActiveSubscription(tenantId: string) {
  return (
    (await db.tenantSubscription.findFirst({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: [{ updatedAt: "desc" }],
    })) ?? {
      plan: SubscriptionPlan.DEMO,
      maxStaffCount: 3,
      maxMonthlyAppointments: 120,
      isActive: true,
    }
  )
}

async function assertPlanFeature(tenantId: string, feature: "reports" | "inventory" | "advancedSettings") {
  const subscription = await getActiveSubscription(tenantId)
  const limits = getPlanLimits(subscription.plan)

  const enabled =
    feature === "reports"
      ? limits.reportsEnabled
      : feature === "inventory"
        ? limits.inventoryEnabled
        : limits.advancedSettingsEnabled

  if (!enabled) {
    throw new SubscriptionFeatureError("Bu ozellik mevcut abonelik planinda kullanilamiyor.")
  }

  return subscription
}

export async function recordAppointmentPayment(input: {
  appointmentId: string
  amount: number
  method: PaymentMethod
  note?: string | null
  actorIdentifier?: string | null
  requestId?: string
  ipAddress?: string
  tenantId?: string
}) {
  const tenantId = await resolveTenantId(input.tenantId)

  return db.$transaction(async (tx) => {
    const appointment = await tx.appointment.findFirstOrThrow({
      where: { id: input.appointmentId, tenantId },
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
        tenantId,
        appointmentId: appointment.id,
        amount: input.amount,
        method: input.method,
        note: input.note?.trim() ? input.note.trim() : null,
        paidAt: new Date(),
      },
    })

    const completedPaidAppointments = await tx.payment.count({
      where: {
        tenantId,
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
        tenantId,
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
        tenantId,
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
          tenantId,
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

export async function getUnpaidCompletedAppointments(limit = 6, options?: { tenantId?: string; accessContext?: AdminAccessContext | null }) {
  const tenantId = await resolveTenantId(options?.tenantId)

  return db.appointment.findMany({
    where: {
      tenantId,
      status: AppointmentStatus.COMPLETED,
      payment: null,
      ...(options?.accessContext?.role === AdminUserRole.STAFF
        ? { staffId: options.accessContext.staffId ?? "__no_access__" }
        : {}),
    },
    include: appointmentWithPaymentInclude,
    orderBy: [{ scheduledAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
  })
}

export async function getEndOfDaySummary(date = getTodayInIstanbul(), options?: { tenantId?: string }) {
  const tenantId = await resolveTenantId(options?.tenantId)
  const dayStart = new Date(`${date}T00:00:00+03:00`)
  const dayEnd = new Date(`${date}T23:59:59.999+03:00`)

  const [payments, unpaidCompletedAppointments, totalTodayAppointments, completedTodayAppointments, cancelledTodayAppointments] =
    await Promise.all([
      db.payment.findMany({
        where: {
          tenantId,
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
          tenantId,
          scheduledDate: date,
          status: AppointmentStatus.COMPLETED,
          payment: null,
        },
        include: {
          service: true,
        },
      }),
      db.appointment.count({
        where: { tenantId, scheduledDate: date },
      }),
      db.appointment.count({
        where: { tenantId, scheduledDate: date, status: AppointmentStatus.COMPLETED },
      }),
      db.appointment.count({
        where: { tenantId, scheduledDate: date, status: AppointmentStatus.CANCELLED },
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

export async function getStaffCommissionSummary(options?: { tenantId?: string }) {
  const tenantId = await resolveTenantId(options?.tenantId)
  const staff = await db.staff.findMany({
    where: { tenantId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })

  const payments = await db.payment.findMany({
    where: {
      tenantId,
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

  const summaryByStaffId = new Map<string, { totalAppointments: number; totalRevenue: number; estimatedCommission: number }>()

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

export async function getActivePackages(options?: { tenantId?: string }) {
  const tenantId = await resolveTenantId(options?.tenantId)

  return db.package.findMany({
    where: { tenantId, isActive: true },
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

export async function getDailyCalendarView(date = getTodayInIstanbul(), options?: { tenantId?: string; accessContext?: AdminAccessContext | null }) {
  const tenantId = await resolveTenantId(options?.tenantId)
  const [staff, appointments] = await Promise.all([
    db.staff.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(options?.accessContext?.role === AdminUserRole.STAFF
          ? { id: options.accessContext.staffId ?? "__no_access__" }
          : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.appointment.findMany({
      where: {
        tenantId,
        scheduledDate: date,
        ...(options?.accessContext?.role === AdminUserRole.STAFF
          ? { staffId: options.accessContext.staffId ?? "__no_access__" }
          : {}),
      },
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
  tenantId?: string
  accessContext?: AdminAccessContext | null
}) {
  const tenantId = await resolveTenantId(input.tenantId)

  if (input.accessContext && !canViewSettings(input.accessContext.role)) {
    throw new SubscriptionFeatureError("Isletme ayarlari sadece yetkili kullanicilar tarafindan guncellenebilir.")
  }

  const existing = await db.businessSettings.findFirst({
    where: { tenantId },
  })
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
          tenantId,
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
    tenantId,
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
  tenantId?: string
}) {
  const tenantId = await resolveTenantId(input.tenantId)
  const customer = await db.customer.findFirstOrThrow({
    where: { id: input.customerId, tenantId },
  })

  const updated = await db.customer.update({
    where: { id: customer.id },
    data: {
      notes: input.notes.trim() || null,
    },
  })

  await createAuditLog({
    tenantId,
    actorType: AuditActorType.ADMIN,
    actorIdentifier: input.actorIdentifier ?? "admin",
    event: AuditEvent.CUSTOMER_UPDATED,
    targetType: "customer",
    targetId: updated.id,
    requestId: input.requestId,
    ipAddress: input.ipAddress,
    metadata: {
      hasNotes: Boolean(updated.notes),
      loyaltyPoints: updated.loyaltyPoints,
    },
  })

  return updated
}

export async function getCustomerDetail(customerId: string, options?: { tenantId?: string }) {
  const tenantId = await resolveTenantId(options?.tenantId)
  const customer = await db.customer.findFirstOrThrow({
    where: { id: customerId, tenantId },
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

export async function getTenantSubscriptionDetails(options?: { tenantId?: string }) {
  const tenantId = await resolveTenantId(options?.tenantId)
  const subscription = await getActiveSubscription(tenantId)
  const limits = getPlanLimits(subscription.plan)
  const [staffCount, currentMonthAppointments] = await Promise.all([
    db.staff.count({ where: { tenantId, isActive: true } }),
    db.appointment.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ])

  return {
    subscription,
    limits,
    usage: {
      staffCount,
      currentMonthAppointments,
    },
  }
}

export async function getDateRangeReport(input: {
  from: string
  to: string
  tenantId?: string
}) {
  const tenantId = await resolveTenantId(input.tenantId)
  await assertPlanFeature(tenantId, "reports")

  const [payments, appointments, customers] = await Promise.all([
    db.payment.findMany({
      where: {
        tenantId,
        paidAt: {
          gte: new Date(`${input.from}T00:00:00+03:00`),
          lte: new Date(`${input.to}T23:59:59.999+03:00`),
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
        tenantId,
        scheduledDate: {
          gte: input.from,
          lte: input.to,
        },
      },
      include: {
        service: true,
        customer: true,
        staff: true,
        payment: true,
      },
    }),
    db.customer.findMany({
      where: { tenantId },
      include: {
        appointments: true,
      },
    }),
  ])

  const byStaff = new Map<string, number>()
  const byService = new Map<string, number>()
  let dailyRevenue = 0

  for (const payment of payments) {
    dailyRevenue += payment.amount
    const staffName = payment.appointment.staff?.name ?? "Atanmamis"
    byStaff.set(staffName, (byStaff.get(staffName) ?? 0) + payment.amount)
    byService.set(payment.appointment.service.title, (byService.get(payment.appointment.service.title) ?? 0) + payment.amount)
  }

  const completedAppointments = appointments.filter((appointment) => appointment.status === AppointmentStatus.COMPLETED).length
  const cancelledAppointments = appointments.filter((appointment) => appointment.status === AppointmentStatus.CANCELLED).length
  const repeatCustomers = customers.filter((customer) => customer.appointments.filter((appointment) => appointment.status === AppointmentStatus.COMPLETED).length > 1).length

  return {
    from: input.from,
    to: input.to,
    revenueTotal: dailyRevenue,
    dailyRevenue: dailyRevenue,
    weeklyRevenue: dailyRevenue,
    monthlyRevenue: dailyRevenue,
    cancelRate: appointments.length ? Math.round((cancelledAppointments / appointments.length) * 100) : 0,
    repeatCustomerRate: customers.length ? Math.round((repeatCustomers / customers.length) * 100) : 0,
    completedAppointments,
    byStaff: Array.from(byStaff.entries()).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue),
    byService: Array.from(byService.entries()).map(([title, revenue]) => ({ title, revenue })).sort((a, b) => b.revenue - a.revenue),
  }
}

export async function exportReportCsv(input: {
  from: string
  to: string
  tenantId?: string
}) {
  const report = await getDateRangeReport(input)
  const rows = [
    ["Metric", "Value"],
    ["Revenue Total", String(report.revenueTotal)],
    ["Completed Appointments", String(report.completedAppointments)],
    ["Cancel Rate", String(report.cancelRate)],
    ["Repeat Customer Rate", String(report.repeatCustomerRate)],
    ...report.byStaff.map((entry) => [`Staff:${entry.name}`, String(entry.revenue)]),
    ...report.byService.map((entry) => [`Service:${entry.title}`, String(entry.revenue)]),
  ]

  return rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n")
}

export async function listInventoryProducts(options?: { tenantId?: string }) {
  const tenantId = await resolveTenantId(options?.tenantId)
  await assertPlanFeature(tenantId, "inventory")

  return db.product.findMany({
    where: { tenantId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  })
}

export async function recordInventorySale(input: {
  productId: string
  quantity: number
  customerId?: string | null
  staffId?: string | null
  paymentMethod: PaymentMethod
  note?: string
  actorIdentifier?: string | null
  requestId?: string
  ipAddress?: string
  tenantId?: string
}) {
  const tenantId = await resolveTenantId(input.tenantId)
  await assertPlanFeature(tenantId, "inventory")

  return db.$transaction(async (tx) => {
    const product = await tx.product.findFirstOrThrow({
      where: { id: input.productId, tenantId, isActive: true },
    })

    if (product.stock < input.quantity) {
      throw new SubscriptionFeatureError("Yeterli stok bulunmuyor.")
    }

    const sale = await tx.sale.create({
      data: {
        tenantId,
        customerId: input.customerId ?? null,
        staffId: input.staffId ?? null,
        totalAmount: product.salePrice * input.quantity,
        paymentMethod: input.paymentMethod,
        note: input.note?.trim() || null,
        items: {
          create: {
            productId: product.id,
            quantity: input.quantity,
            unitPrice: product.salePrice,
          },
        },
      },
      include: {
        items: true,
      },
    })

    await tx.product.update({
      where: { id: product.id },
      data: {
        stock: {
          decrement: input.quantity,
        },
      },
    })

    await createAuditLog(
      {
        tenantId,
        actorType: AuditActorType.ADMIN,
        actorIdentifier: input.actorIdentifier ?? "admin",
        event: AuditEvent.INVENTORY_SALE_RECORDED,
        targetType: "sale",
        targetId: sale.id,
        requestId: input.requestId,
        ipAddress: input.ipAddress,
        metadata: {
          productId: product.id,
          quantity: input.quantity,
          totalAmount: sale.totalAmount,
        },
      },
      tx
    )

    return sale
  })
}

export async function listAdminUsers(options?: { tenantId?: string }) {
  const tenantId = await resolveTenantId(options?.tenantId)

  return db.adminUser.findMany({
    where: { tenantId },
    include: {
      staff: true,
    },
    orderBy: [{ role: "asc" }, { username: "asc" }],
  })
}

export async function upsertStaffAvailability(input: {
  staffId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  breakStartTime?: string
  breakEndTime?: string
  actorIdentifier?: string | null
  requestId?: string
  ipAddress?: string
  tenantId?: string
}) {
  const tenantId = await resolveTenantId(input.tenantId)
  const staff = await db.staff.findFirstOrThrow({
    where: { id: input.staffId, tenantId },
  })

  const availability = await db.staffAvailability.upsert({
    where: {
      id: `${staff.id}-${input.dayOfWeek}`,
    },
    update: {
      startTime: input.startTime,
      endTime: input.endTime,
      breakStartTime: input.breakStartTime?.trim() || null,
      breakEndTime: input.breakEndTime?.trim() || null,
      isActive: true,
    },
    create: {
      id: `${staff.id}-${input.dayOfWeek}`,
      staffId: staff.id,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      breakStartTime: input.breakStartTime?.trim() || null,
      breakEndTime: input.breakEndTime?.trim() || null,
      isActive: true,
    },
  })

  await createAuditLog({
    tenantId,
    actorType: AuditActorType.ADMIN,
    actorIdentifier: input.actorIdentifier ?? "admin",
    event: AuditEvent.STAFF_AVAILABILITY_UPDATED,
    targetType: "staff_availability",
    targetId: availability.id,
    requestId: input.requestId,
    ipAddress: input.ipAddress,
    metadata: {
      staffId: staff.id,
      dayOfWeek: input.dayOfWeek,
    },
  })

  return availability
}

export async function createStaffTimeOff(input: {
  staffId: string
  startDate: string
  endDate: string
  isAllDay?: boolean
  startTime?: string
  endTime?: string
  reason?: string
  actorIdentifier?: string | null
  requestId?: string
  ipAddress?: string
  tenantId?: string
}) {
  const tenantId = await resolveTenantId(input.tenantId)
  const staff = await db.staff.findFirstOrThrow({
    where: { id: input.staffId, tenantId },
  })

  const timeOff = await db.staffTimeOff.create({
    data: {
      staffId: staff.id,
      startDate: input.startDate,
      endDate: input.endDate,
      isAllDay: input.isAllDay ?? true,
      startTime: input.startTime?.trim() || null,
      endTime: input.endTime?.trim() || null,
      reason: input.reason?.trim() || null,
    },
  })

  await createAuditLog({
    tenantId,
    actorType: AuditActorType.ADMIN,
    actorIdentifier: input.actorIdentifier ?? "admin",
    event: AuditEvent.STAFF_TIMEOFF_UPDATED,
    targetType: "staff_timeoff",
    targetId: timeOff.id,
    requestId: input.requestId,
    ipAddress: input.ipAddress,
    metadata: {
      staffId: staff.id,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  })

  return timeOff
}

export async function beginCustomerPortalAccess(input: {
  identifier: string
  tenantId?: string
}) {
  const tenantId = await resolveTenantId(input.tenantId)
  const normalizedIdentifier = input.identifier.trim().toLowerCase()

  const customer = await db.customer.findFirst({
    where: {
      tenantId,
      OR: [{ email: normalizedIdentifier }, { phone: normalizedIdentifier }],
    },
  })

  if (!customer) {
    throw new CustomerPortalAccessError("Bu bilgi ile eslesen musteri kaydi bulunamadi.")
  }

  const code = "123456"
  const token = await db.customerAccessCode.create({
    data: {
      tenantId,
      customerId: customer.id,
      identifier: normalizedIdentifier,
      codeHash: hashPassword(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })

  return {
    tokenId: token.id,
    customerId: customer.id,
    mockCode: code,
  }
}

export async function verifyCustomerPortalAccess(input: {
  tokenId: string
  code: string
  tenantId?: string
}) {
  const tenantId = await resolveTenantId(input.tenantId)
  const token = await db.customerAccessCode.findFirst({
    where: {
      id: input.tokenId,
      tenantId,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  })

  if (!token) {
    throw new CustomerPortalAccessError("Kodun suresi dolmus veya gecersiz.")
  }

  if (input.code.trim() !== "123456") {
    throw new CustomerPortalAccessError("Kod gecersiz.")
  }

  await db.customerAccessCode.update({
    where: { id: token.id },
    data: {
      consumedAt: new Date(),
    },
  })

  return {
    customerId: token.customerId,
  }
}

export async function getCustomerPortalSnapshot(input: {
  customerId: string
  tenantId?: string
}) {
  const tenantId = await resolveTenantId(input.tenantId)
  const detail = await getCustomerDetail(input.customerId, { tenantId })

  return {
    customer: detail.customer,
    loyaltyPoints: detail.customer.loyaltyPoints,
    loyaltyPerPaidAppointment: LOYALTY_POINTS_PER_PAID_APPOINTMENT,
    totalSpending: detail.totalSpending,
    completedPaidAppointments: detail.completedPaidAppointments,
    discountCount: detail.discountCount,
    appointments: detail.customer.appointments,
  }
}

export async function requestAppointmentCancellation(input: {
  appointmentId: string
  customerId: string
  reason?: string
  tenantId?: string
}) {
  const tenantId = await resolveTenantId(input.tenantId)
  const appointment = await db.appointment.findFirstOrThrow({
    where: {
      id: input.appointmentId,
      tenantId,
      customerId: input.customerId,
    },
  })

  const request = await db.appointmentCancellationRequest.create({
    data: {
      tenantId,
      appointmentId: appointment.id,
      customerId: input.customerId,
      reason: input.reason?.trim() || null,
      status: CancellationRequestStatus.PENDING,
    },
  })

  await createAuditLog({
    tenantId,
    actorType: AuditActorType.CUSTOMER,
    actorIdentifier: input.customerId,
    event: AuditEvent.APPOINTMENT_CANCELLATION_REQUESTED,
    targetType: "appointment_cancellation_request",
    targetId: request.id,
    metadata: {
      appointmentId: appointment.id,
    },
  })

  return request
}

export async function completeSetupWizard(input: {
  tenantName: string
  phone: string
  staffMembers: Array<{ name: string; role: string }>
  services: Array<{ slug: string; title: string; shortTitle: string; teaser: string; description: string; durationMinutes: number; priceFrom: number }>
  ownerUsername: string
  ownerEmail: string
  ownerPassword: string
  tenantSlug?: string
}) {
  const tenantSlug = input.tenantSlug?.trim().toLowerCase() || "default"

  return db.$transaction(async (tx) => {
    const tenant = await tx.tenant.upsert({
      where: { slug: tenantSlug },
      update: {
        name: input.tenantName,
        phone: input.phone,
        mode: TenantMode.PRODUCTION,
        isSetupComplete: true,
        setupCompletedAt: new Date(),
      },
      create: {
        slug: tenantSlug,
        name: input.tenantName,
        phone: input.phone,
        mode: TenantMode.PRODUCTION,
        isSetupComplete: true,
        setupCompletedAt: new Date(),
      },
    })

    await tx.businessSettings.upsert({
      where: { tenantId: tenant.id },
      update: {
        businessName: input.tenantName,
        tagline: "Salon operasyon merkezi",
        phone: input.phone,
        whatsappPhone: input.phone,
        email: input.ownerEmail,
        address: "Adres bilgisi kurulum sonrasinda guncellenecek.",
        city: "Istanbul",
        timezone: "Europe/Istanbul",
        currency: "TRY",
        dailyCapacity: 24,
      },
      create: {
        tenantId: tenant.id,
        businessName: input.tenantName,
        tagline: "Salon operasyon merkezi",
        phone: input.phone,
        whatsappPhone: input.phone,
        email: input.ownerEmail,
        address: "Adres bilgisi kurulum sonrasinda guncellenecek.",
        city: "Istanbul",
        timezone: "Europe/Istanbul",
        currency: "TRY",
        dailyCapacity: 24,
      },
    })

    await tx.tenantSubscription.upsert({
      where: { tenantId: tenant.id },
      update: {
        plan: SubscriptionPlan.PRO,
        maxStaffCount: 999,
        maxMonthlyAppointments: 99999,
        isActive: true,
      },
      create: {
        tenantId: tenant.id,
        plan: SubscriptionPlan.PRO,
        maxStaffCount: 999,
        maxMonthlyAppointments: 99999,
        isActive: true,
      },
    })

    const createdStaff = []

    for (const [index, staffMember] of input.staffMembers.entries()) {
      const staff = await tx.staff.create({
        data: {
          tenantId: tenant.id,
          name: staffMember.name,
          role: staffMember.role,
          bio: `${staffMember.role} icin kurulum sirasinda olusturulan ekip profili.`,
          avatar: "/images/team-1.jpg",
          sortOrder: index + 1,
          commissionRate: 10,
        },
      })
      createdStaff.push(staff)
    }

    for (const [index, service] of input.services.entries()) {
      await tx.service.create({
        data: {
          tenantId: tenant.id,
          slug: service.slug,
          title: service.title,
          shortTitle: service.shortTitle,
          teaser: service.teaser,
          description: service.description,
          image: "/images/service-haircut.jpg",
          priceFrom: service.priceFrom,
          priceLabel: `${service.priceFrom} TL`,
          durationMinutes: service.durationMinutes,
          sortOrder: index + 1,
          isActive: true,
          features: ["Kurulum sihirbazi ile olusturuldu"],
        },
      })
    }

    await tx.adminUser.upsert({
      where: {
        tenantId_username: {
          tenantId: tenant.id,
          username: input.ownerUsername,
        },
      },
      update: {
        email: input.ownerEmail,
        passwordHash: hashPassword(input.ownerPassword),
        role: AdminUserRole.OWNER,
        isActive: true,
      },
      create: {
        tenantId: tenant.id,
        username: input.ownerUsername,
        email: input.ownerEmail,
        passwordHash: hashPassword(input.ownerPassword),
        role: AdminUserRole.OWNER,
        isActive: true,
      },
    })

    await createAuditLog(
      {
        tenantId: tenant.id,
        actorType: AuditActorType.SYSTEM,
        actorIdentifier: "setup-wizard",
        event: AuditEvent.TENANT_SETUP_COMPLETED,
        targetType: "tenant",
        targetId: tenant.id,
        metadata: {
          staffCount: createdStaff.length,
          serviceCount: input.services.length,
        },
      },
      tx
    )

    return tenant
  })
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

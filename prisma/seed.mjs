import { randomBytes, scryptSync } from "node:crypto"
import {
  AdminUserRole,
  AppointmentSource,
  AppointmentStatus,
  PaymentMethod,
  PrismaClient,
  SubscriptionPlan,
  TenantMode,
} from "@prisma/client"

const prisma = new PrismaClient()

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex")
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`
}

function toScheduledAt(date, time) {
  return new Date(`${date}T${time}:00+03:00`)
}

function daysFromToday(offset) {
  const now = new Date()
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(now)
    .reduce((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value
      }
      return acc
    }, {})

  const current = new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00+03:00`)
  current.setUTCDate(current.getUTCDate() + offset)
  return current.toISOString().slice(0, 10)
}

async function resetData() {
  await prisma.saleItem.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.product.deleteMany()
  await prisma.customerAccessCode.deleteMany()
  await prisma.appointmentCancellationRequest.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.packageService.deleteMany()
  await prisma.package.deleteMany()
  await prisma.staffTimeOff.deleteMany()
  await prisma.staffAvailability.deleteMany()
  await prisma.adminUser.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.service.deleteMany()
  await prisma.tenantSubscription.deleteMany()
  await prisma.businessSettings.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.tenant.deleteMany({
    where: {
      slug: {
        in: ["default", "north-demo"],
      },
    },
  })
}

async function seedTenant(config) {
  const tenant = await prisma.tenant.create({
    data: {
      slug: config.slug,
      name: config.name,
      phone: config.phone,
      email: config.email,
      currency: "TRY",
      timezone: "Europe/Istanbul",
      mode: config.mode,
      isActive: true,
      isSetupComplete: true,
      setupCompletedAt: new Date(),
    },
  })

  await prisma.businessSettings.create({
    data: {
      tenantId: tenant.id,
      businessName: config.name,
      tagline: config.tagline,
      phone: config.phone,
      whatsappPhone: config.phone,
      email: config.email,
      address: config.address,
      city: config.city,
      timezone: "Europe/Istanbul",
      currency: "TRY",
      dailyCapacity: config.dailyCapacity,
      workingHours: {
        note: config.workingHoursNote,
      },
    },
  })

  await prisma.tenantSubscription.create({
    data: {
      tenantId: tenant.id,
      plan: config.plan,
      maxStaffCount: config.plan === SubscriptionPlan.PRO ? 999 : 6,
      maxMonthlyAppointments: config.plan === SubscriptionPlan.PRO ? 99999 : 400,
      isActive: true,
    },
  })

  const services = []
  for (const [index, service] of config.services.entries()) {
    services.push(
      await prisma.service.create({
        data: {
          tenantId: tenant.id,
          slug: service.slug,
          title: service.title,
          shortTitle: service.shortTitle,
          teaser: service.teaser,
          description: service.description,
          image: service.image,
          priceFrom: service.priceFrom,
          priceLabel: `${service.priceFrom} TL`,
          durationMinutes: service.durationMinutes,
          isActive: true,
          sortOrder: index + 1,
          features: service.features,
        },
      })
    )
  }

  const serviceBySlug = new Map(services.map((service) => [service.slug, service]))

  const staff = []
  for (const [index, member] of config.staff.entries()) {
    const created = await prisma.staff.create({
      data: {
        tenantId: tenant.id,
        name: member.name,
        role: member.role,
        bio: member.bio,
        avatar: member.avatar,
        isActive: true,
        sortOrder: index + 1,
        commissionRate: member.commissionRate,
      },
    })
    staff.push(created)

    for (const dayOfWeek of [1, 2, 3, 4, 5, 6]) {
      await prisma.staffAvailability.create({
        data: {
          staffId: created.id,
          dayOfWeek,
          startTime: "10:00",
          endTime: "19:00",
          breakStartTime: "13:00",
          breakEndTime: "14:00",
          isActive: true,
        },
      })
    }
  }

  const staffByName = new Map(staff.map((member) => [member.name, member]))

  const customers = []
  for (const customer of config.customers) {
    customers.push(
      await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          notes: customer.notes,
        },
      })
    )
  }

  const customerByEmail = new Map(customers.map((customer) => [customer.email, customer]))

  for (const pkg of config.packages) {
    const createdPackage = await prisma.package.create({
      data: {
        tenantId: tenant.id,
        slug: pkg.slug,
        name: pkg.name,
        teaser: pkg.teaser,
        packagePrice: pkg.packagePrice,
        totalDurationMinutes: pkg.totalDurationMinutes,
        isActive: true,
      },
    })

    for (const [index, serviceSlug] of pkg.serviceSlugs.entries()) {
      await prisma.packageService.create({
        data: {
          packageId: createdPackage.id,
          serviceId: serviceBySlug.get(serviceSlug).id,
          sortOrder: index + 1,
        },
      })
    }
  }

  for (const product of config.products) {
    await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: product.name,
        sku: product.sku,
        stock: product.stock,
        purchasePrice: product.purchasePrice,
        salePrice: product.salePrice,
        isActive: true,
      },
    })
  }

  for (const appointment of config.appointments) {
    const created = await prisma.appointment.create({
      data: {
        tenantId: tenant.id,
        customerId: customerByEmail.get(appointment.customerEmail).id,
        serviceId: serviceBySlug.get(appointment.serviceSlug).id,
        staffId: appointment.staffName ? staffByName.get(appointment.staffName).id : null,
        status: appointment.status,
        source: appointment.source,
        scheduledDate: appointment.scheduledDate,
        scheduledTime: appointment.scheduledTime,
        scheduledAt: toScheduledAt(appointment.scheduledDate, appointment.scheduledTime),
        notes: appointment.notes,
      },
    })

    if (appointment.payment) {
      await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          appointmentId: created.id,
          amount: appointment.payment.amount,
          method: appointment.payment.method,
          paidAt: new Date(`${appointment.scheduledDate}T${appointment.scheduledTime}:00+03:00`),
          note: appointment.payment.note,
        },
      })
    }
  }

  for (const customer of customers) {
    const paidCompletedCount = await prisma.payment.count({
      where: {
        tenantId: tenant.id,
        appointment: {
          customerId: customer.id,
          status: AppointmentStatus.COMPLETED,
        },
      },
    })

    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        loyaltyPoints: paidCompletedCount * 20,
      },
    })
  }

  await prisma.adminUser.create({
    data: {
      tenantId: tenant.id,
      username: config.owner.username,
      email: config.owner.email,
      passwordHash: hashPassword(config.owner.password),
      role: AdminUserRole.OWNER,
      isActive: true,
    },
  })

  if (staff[0]) {
    await prisma.adminUser.create({
      data: {
        tenantId: tenant.id,
        staffId: staff[0].id,
        username: `${config.slug}-staff`,
        email: `staff-${config.slug}@demo.local`,
        passwordHash: hashPassword("StaffPanel123!"),
        role: AdminUserRole.STAFF,
        isActive: true,
      },
    })
  }
}

const sharedServices = [
  {
    slug: "sac-kesim-tasarim",
    title: "Sac Kesim ve Tasarim",
    shortTitle: "Sac Kesim",
    teaser: "Yuz hattina uygun premium kesim.",
    description: "Danismanlik, yikama ve finish dahil profesyonel kesim paketi.",
    image: "/images/service-haircut.jpg",
    priceFrom: 950,
    durationMinutes: 60,
    features: ["Stil analizi", "Yikama", "Finish"],
  },
  {
    slug: "sac-boyama",
    title: "Sac Boyama",
    shortTitle: "Boyama",
    teaser: "Tonlama ve premium renk operasyonu.",
    description: "Dip boya, ton esitleme ve koruma odakli boyama.",
    image: "/images/service-coloring.jpg",
    priceFrom: 2200,
    durationMinutes: 150,
    features: ["Renk analizi", "Tonlama", "Koruyucu seri"],
  },
  {
    slug: "keratin-bakimi",
    title: "Keratin Bakimi",
    shortTitle: "Keratin",
    teaser: "Yogun bakim ve parlaklik.",
    description: "Kabarmayi azaltan premium keratin uygulamasi.",
    image: "/images/service-keratin.jpg",
    priceFrom: 2800,
    durationMinutes: 120,
    features: ["Onarim", "Parlaklik", "Ev bakim plani"],
  },
]

async function main() {
  await resetData()

  await seedTenant({
    slug: "default",
    name: "Adakan Hair Studio",
    phone: "905399416521",
    email: "adakansoftware@gmail.com",
    tagline: "Satilabilir cok kiracili salon operasyon platformu",
    address: "Bagdat Caddesi No:128, Caddebostan",
    city: "Istanbul",
    workingHoursNote: "10:00-20:00 operasyon, 09:30 hazirlik.",
    dailyCapacity: 24,
    mode: TenantMode.PRODUCTION,
    plan: SubscriptionPlan.PRO,
    services: sharedServices,
    staff: [
      { name: "Elif Aydin", role: "Kurucu Stilist", bio: "Premium kesim ve deneyim uzmani.", avatar: "/images/team-1.jpg", commissionRate: 15 },
      { name: "Emre Kilic", role: "Renk Uzmani", bio: "Renk donusumu ve tonlama lideri.", avatar: "/images/team-2.jpg", commissionRate: 12 },
      { name: "Seda Ozturk", role: "Bakim Uzmani", bio: "Bakim ve keratin uygulamalari uzmani.", avatar: "/images/team-3.jpg", commissionRate: 10 },
    ],
    customers: [
      { name: "Zeynep Kaya", email: "zeynep.kaya@demo.local", phone: "905321110001", notes: "Soguk ton seviyor." },
      { name: "Melis Demir", email: "melis.demir@demo.local", phone: "905321110002", notes: "Cumartesi sabah tercih ediyor." },
      { name: "Ayse Tunc", email: "ayse.tunc@demo.local", phone: "905321110003", notes: "Keratin sonrasi urun soruyor." },
    ],
    packages: [
      {
        slug: "renk-bakim-paketi",
        name: "Renk ve Bakim Paketi",
        teaser: "Boyama sonrasi keratin destekli premium paket.",
        packagePrice: 4500,
        totalDurationMinutes: 270,
        serviceSlugs: ["sac-boyama", "keratin-bakimi"],
      },
    ],
    products: [
      { name: "Profesyonel Sampuan", sku: "ADA-SAM-001", stock: 20, purchasePrice: 180, salePrice: 350 },
      { name: "Mat Wax", sku: "ADA-WAX-002", stock: 14, purchasePrice: 90, salePrice: 220 },
    ],
    appointments: [
      {
        customerEmail: "zeynep.kaya@demo.local",
        serviceSlug: "sac-boyama",
        staffName: "Emre Kilic",
        status: AppointmentStatus.COMPLETED,
        source: AppointmentSource.ADMIN,
        scheduledDate: daysFromToday(-2),
        scheduledTime: "11:00",
        notes: "Renk koruyucu seri onerildi.",
        payment: { amount: 2400, method: PaymentMethod.CARD, note: "POS slip 4812" },
      },
      {
        customerEmail: "zeynep.kaya@demo.local",
        serviceSlug: "keratin-bakimi",
        staffName: "Seda Ozturk",
        status: AppointmentStatus.COMPLETED,
        source: AppointmentSource.WEB,
        scheduledDate: daysFromToday(0),
        scheduledTime: "14:00",
        notes: "Tahsilat bekliyor.",
      },
      {
        customerEmail: "melis.demir@demo.local",
        serviceSlug: "sac-kesim-tasarim",
        staffName: "Elif Aydin",
        status: AppointmentStatus.CONFIRMED,
        source: AppointmentSource.WEB,
        scheduledDate: daysFromToday(1),
        scheduledTime: "10:00",
        notes: "Onayli randevu.",
      },
    ],
    owner: {
      username: "owner",
      email: "owner@adakan.demo",
      password: "OwnerPanel123!",
    },
  })

  await seedTenant({
    slug: "north-demo",
    name: "North Demo Salon",
    phone: "905301110999",
    email: "north@demo.local",
    tagline: "Ikinci tenant izolasyon testi",
    address: "Atasehir / Istanbul",
    city: "Istanbul",
    workingHoursNote: "10:00-19:00 operasyon.",
    dailyCapacity: 12,
    mode: TenantMode.DEMO,
    plan: SubscriptionPlan.BASIC,
    services: sharedServices,
    staff: [
      { name: "Derya Cetin", role: "Salon Yoneticisi", bio: "Operasyon ve musteri takibi.", avatar: "/images/team-1.jpg", commissionRate: 8 },
    ],
    customers: [
      { name: "Burcu Eren", email: "burcu.eren@demo.local", phone: "905321119999", notes: "Tenant izolasyon musteri kaydi." },
    ],
    packages: [],
    products: [
      { name: "Bakim Kremi", sku: "NOR-KRM-001", stock: 8, purchasePrice: 110, salePrice: 240 },
    ],
    appointments: [
      {
        customerEmail: "burcu.eren@demo.local",
        serviceSlug: "sac-kesim-tasarim",
        staffName: "Derya Cetin",
        status: AppointmentStatus.NEW,
        source: AppointmentSource.WEB,
        scheduledDate: daysFromToday(1),
        scheduledTime: "12:00",
        notes: "Ikinci tenant yeni talep.",
      },
    ],
    owner: {
      username: "north-owner",
      email: "north-owner@demo.local",
      password: "NorthOwner123!",
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })

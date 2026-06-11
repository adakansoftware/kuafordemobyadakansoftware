import { AppointmentSource, AppointmentStatus, PaymentMethod, PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const services = [
  {
    slug: "sac-kesim-tasarim",
    title: "Sac Kesim ve Tasarim",
    shortTitle: "Sac Kesim",
    teaser: "Yuz hatlarina uygun premium kesim deneyimi.",
    description: "Danismanlik, yikama ve sekillendirme ile tamamlanan profesyonel kesim paketi.",
    image: "/images/service-haircut.jpg",
    priceFrom: 950,
    priceLabel: "950 TL",
    durationMinutes: 60,
    sortOrder: 1,
    features: [
      "Yuze uygun stil plani",
      "Yikama ve son sekillendirme",
      "Gunluk kullanim odakli kesim",
      "Bakim onerileri",
    ],
  },
  {
    slug: "sac-boyama",
    title: "Sac Boyama",
    shortTitle: "Boyama",
    teaser: "Canli tonlar ve kontrollu renk gecisleri.",
    description: "Dip boya, tonlama ve modern renk gecis teknikleri ile premium hizmet.",
    image: "/images/service-coloring.jpg",
    priceFrom: 2200,
    priceLabel: "2.200 TL",
    durationMinutes: 150,
    sortOrder: 2,
    features: [
      "Renk analizi",
      "Tonlama ve koruma",
      "Profesyonel urun secimi",
      "Sonrasi bakim yonlendirmesi",
    ],
  },
  {
    slug: "keratin-bakimi",
    title: "Keratin Bakimi",
    shortTitle: "Keratin",
    teaser: "Parlaklik ve yumusaklik kazandiran yogun bakim.",
    description: "Sac telini destekleyen, kabarmayi azaltan premium keratin uygulamasi.",
    image: "/images/service-keratin.jpg",
    priceFrom: 2800,
    priceLabel: "2.800 TL",
    durationMinutes: 120,
    sortOrder: 3,
    features: [
      "Yumusak doku",
      "Parlak bitis",
      "Kolay sekil alma",
      "Ev bakim plani",
    ],
  },
  {
    slug: "fon-sekillendirme",
    title: "Fon ve Sekillendirme",
    shortTitle: "Fon",
    teaser: "Hizli ve bakimli gorunum icin sekillendirme.",
    description: "Gunluk ya da ozel gunler icin profesyonel fon ve finish paketi.",
    image: "/images/service-blowdry.jpg",
    priceFrom: 650,
    priceLabel: "650 TL",
    durationMinutes: 45,
    sortOrder: 4,
    features: [
      "Duz veya hacimli bitis",
      "Isi kontrollu uygulama",
      "Hizli operasyon",
      "Ozel gun hazirligi",
    ],
  },
  {
    slug: "cilt-bakimi",
    title: "Cilt Bakimi",
    shortTitle: "Cilt Bakimi",
    teaser: "Temizlik, nem ve canlilik odakli bakim.",
    description: "Kuafor operasyonuna destek veren hizli premium cilt bakimi uygulamasi.",
    image: "/images/service-skin.jpg",
    priceFrom: 1400,
    priceLabel: "1.400 TL",
    durationMinutes: 50,
    sortOrder: 5,
    features: [
      "Temel analiz",
      "Temizlik ve nem bakimi",
      "Dinlendiren maske",
      "Ev kullanimi tavsiyesi",
    ],
  },
  {
    slug: "sakal-tasarim",
    title: "Sakal Tasarim",
    shortTitle: "Sakal",
    teaser: "Yuze uygun net cizgiler ve bakimli gorunum.",
    description: "Erkek bakim operasyonlari icin hizli ve temiz sakal tasarim uygulamasi.",
    image: "/images/service-beard.jpg",
    priceFrom: 500,
    priceLabel: "500 TL",
    durationMinutes: 30,
    sortOrder: 6,
    features: [
      "Hat duzeltme",
      "Sicak havlu uygulamasi",
      "Keskin cizgi bitisi",
      "Bakim tavsiyesi",
    ],
  },
]

const staffMembers = [
  {
    name: "Elif Aydin",
    role: "Kurucu ve Bas Stilist",
    bio: "Kesim, premium deneyim ve VIP musteri operasyonunda uzman.",
    avatar: "/images/team-1.jpg",
    sortOrder: 1,
    commissionRate: 15,
  },
  {
    name: "Emre Kilic",
    role: "Renk Uzmani",
    bio: "Boya, tonlama ve donusum operasyonlarinda lider.",
    avatar: "/images/team-2.jpg",
    sortOrder: 2,
    commissionRate: 12,
  },
  {
    name: "Seda Ozturk",
    role: "Bakim Uzmani",
    bio: "Bakim, keratin ve operasyon surec standardizasyonu alaninda uzman.",
    avatar: "/images/team-3.jpg",
    sortOrder: 3,
    commissionRate: 10,
  },
  {
    name: "Mert Arslan",
    role: "Erkek Bakim Uzmani",
    bio: "Sakal ve hizli erkek bakim operasyonlarinda guclu kapasite sunar.",
    avatar: "/images/team-4.jpg",
    sortOrder: 4,
    commissionRate: 8,
  },
]

const customers = [
  {
    name: "Zeynep Kaya",
    email: "zeynep.kaya@demo.local",
    phone: "905321110001",
    notes: "Renk islemlerinde soguk ton seviyor. Kahve ikrami tercih ediyor.",
  },
  {
    name: "Melis Demir",
    email: "melis.demir@demo.local",
    phone: "905321110002",
    notes: "Cumartesi sabahlarini tercih ediyor. Sac ucu hassas.",
  },
  {
    name: "Ayse Tunc",
    email: "ayse.tunc@demo.local",
    phone: "905321110003",
    notes: "Keratin sonrasi urun önerisi istiyor.",
  },
  {
    name: "Burak Yilmaz",
    email: "burak.yilmaz@demo.local",
    phone: "905321110004",
    notes: "Damat paketi aday musteri. Hizli cikis bekliyor.",
  },
  {
    name: "Ece Sahin",
    email: "ece.sahin@demo.local",
    phone: "905321110005",
    notes: "Son dakika degisiklik yapabiliyor; hatirlatma onemli.",
  },
  {
    name: "Deniz Aksoy",
    email: "deniz.aksoy@demo.local",
    phone: "905321110006",
    notes: "Kart ile odeme yapiyor, paket hizmetlerle ilgileniyor.",
  },
]

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

  const istanbulToday = new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00+03:00`)
  istanbulToday.setUTCDate(istanbulToday.getUTCDate() + offset)

  return istanbulToday.toISOString().slice(0, 10)
}

async function resetDemoData() {
  await prisma.payment.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.packageService.deleteMany()
  await prisma.package.deleteMany()

  await prisma.customer.deleteMany({
    where: {
      email: {
        in: customers.map((customer) => customer.email),
      },
    },
  })
}

async function upsertCoreData() {
  await prisma.businessSettings.upsert({
    where: { id: "adakan-core-settings" },
    update: {
      businessName: "Adakan Hair Studio",
      tagline: "Satilabilir kuafor operasyon, odeme ve sadakat platformu",
      phone: "905399416521",
      whatsappPhone: "905399416521",
      email: "adakansoftware@gmail.com",
      address: "Bagdat Caddesi No:128, Caddebostan",
      city: "Istanbul",
      timezone: "Europe/Istanbul",
      currency: "TRY",
      dailyCapacity: 24,
      workingHours: {
        note: "Hazirlik: 09:30. Operasyon: 10:00-20:00. Pazar rezervasyon bazli.",
      },
    },
    create: {
      id: "adakan-core-settings",
      businessName: "Adakan Hair Studio",
      tagline: "Satilabilir kuafor operasyon, odeme ve sadakat platformu",
      phone: "905399416521",
      whatsappPhone: "905399416521",
      email: "adakansoftware@gmail.com",
      address: "Bagdat Caddesi No:128, Caddebostan",
      city: "Istanbul",
      timezone: "Europe/Istanbul",
      currency: "TRY",
      dailyCapacity: 24,
      workingHours: {
        note: "Hazirlik: 09:30. Operasyon: 10:00-20:00. Pazar rezervasyon bazli.",
      },
    },
  })

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    })
  }

  for (const staff of staffMembers) {
    await prisma.staff.upsert({
      where: { name: staff.name },
      update: staff,
      create: staff,
    })
  }
}

async function seedCustomers() {
  const result = new Map()

  for (const customer of customers) {
    const record = await prisma.customer.create({
      data: {
        ...customer,
        loyaltyPoints: 0,
      },
    })

    result.set(customer.email, record)
  }

  return result
}

async function seedPackages(serviceBySlug) {
  const packageDefinitions = [
    {
      slug: "damat-paketi",
      name: "Damat Paketi",
      teaser: "Sac, sakal ve cilt bakimini tek akista birlestiren premium erkek bakim paketi.",
      packagePrice: 2550,
      totalDurationMinutes: 140,
      serviceSlugs: ["sac-kesim-tasarim", "sakal-tasarim", "cilt-bakimi"],
    },
    {
      slug: "renk-bakim-paketi",
      name: "Renk ve Bakim Paketi",
      teaser: "Boyama sonrasi keratin destekli premium yenilenme paketi.",
      packagePrice: 4500,
      totalDurationMinutes: 270,
      serviceSlugs: ["sac-boyama", "keratin-bakimi"],
    },
  ]

  for (const pkg of packageDefinitions) {
    const createdPackage = await prisma.package.create({
      data: {
        slug: pkg.slug,
        name: pkg.name,
        teaser: pkg.teaser,
        packagePrice: pkg.packagePrice,
        totalDurationMinutes: pkg.totalDurationMinutes,
        isActive: true,
      },
    })

    for (const [index, serviceSlug] of pkg.serviceSlugs.entries()) {
      const service = serviceBySlug.get(serviceSlug)
      await prisma.packageService.create({
        data: {
          packageId: createdPackage.id,
          serviceId: service.id,
          sortOrder: index + 1,
        },
      })
    }
  }
}

async function seedAppointments({ serviceBySlug, staffByName, customerByEmail }) {
  const today = daysFromToday(0)
  const yesterday = daysFromToday(-1)
  const twoDaysAgo = daysFromToday(-2)
  const threeDaysAgo = daysFromToday(-3)
  const fourDaysAgo = daysFromToday(-4)
  const tomorrow = daysFromToday(1)
  const dayAfterTomorrow = daysFromToday(2)

  const appointmentDefinitions = [
    {
      customerEmail: "zeynep.kaya@demo.local",
      serviceSlug: "sac-boyama",
      staffName: "Emre Kilic",
      status: AppointmentStatus.COMPLETED,
      source: AppointmentSource.ADMIN,
      scheduledDate: fourDaysAgo,
      scheduledTime: "11:00",
      notes: "Renk koruyucu seri onerildi.",
      payment: { amount: 2400, method: PaymentMethod.CARD, note: "POS slip 4812" },
    },
    {
      customerEmail: "zeynep.kaya@demo.local",
      serviceSlug: "fon-sekillendirme",
      staffName: "Elif Aydin",
      status: AppointmentStatus.COMPLETED,
      source: AppointmentSource.WEB,
      scheduledDate: twoDaysAgo,
      scheduledTime: "17:00",
      notes: "Aksam etkinligi icin hizli finish.",
      payment: { amount: 650, method: PaymentMethod.CASH, note: "Kasadan tahsil" },
    },
    {
      customerEmail: "zeynep.kaya@demo.local",
      serviceSlug: "sac-kesim-tasarim",
      staffName: "Elif Aydin",
      status: AppointmentStatus.COMPLETED,
      source: AppointmentSource.ADMIN,
      scheduledDate: yesterday,
      scheduledTime: "10:30",
      notes: "Katli kesim tercih edildi.",
      payment: { amount: 950, method: PaymentMethod.CARD, note: "Sadakat puani isledi" },
    },
    {
      customerEmail: "zeynep.kaya@demo.local",
      serviceSlug: "fon-sekillendirme",
      staffName: "Elif Aydin",
      status: AppointmentStatus.COMPLETED,
      source: AppointmentSource.WEB,
      scheduledDate: today,
      scheduledTime: "12:00",
      notes: "Bugun tamamlandi ama tahsilat bekliyor.",
    },
    {
      customerEmail: "zeynep.kaya@demo.local",
      serviceSlug: "keratin-bakimi",
      staffName: "Seda Ozturk",
      status: AppointmentStatus.COMPLETED,
      source: AppointmentSource.ADMIN,
      scheduledDate: threeDaysAgo,
      scheduledTime: "15:00",
      notes: "Besinci odenmis islem olacak.",
      payment: { amount: 2800, method: PaymentMethod.IBAN, note: "Havale referansi 9301" },
    },
    {
      customerEmail: "melis.demir@demo.local",
      serviceSlug: "sac-kesim-tasarim",
      staffName: "Elif Aydin",
      status: AppointmentStatus.CONFIRMED,
      source: AppointmentSource.WEB,
      scheduledDate: tomorrow,
      scheduledTime: "10:00",
      notes: "Cumartesi oncesi bakim istiyor.",
    },
    {
      customerEmail: "ayse.tunc@demo.local",
      serviceSlug: "keratin-bakimi",
      staffName: "Seda Ozturk",
      status: AppointmentStatus.COMPLETED,
      source: AppointmentSource.ADMIN,
      scheduledDate: today,
      scheduledTime: "14:00",
      notes: "Ev bakim plani anlatildi.",
      payment: { amount: 2900, method: PaymentMethod.CARD, note: "Ek urun satisi dahil" },
    },
    {
      customerEmail: "burak.yilmaz@demo.local",
      serviceSlug: "sakal-tasarim",
      staffName: "Mert Arslan",
      status: AppointmentStatus.CONFIRMED,
      source: AppointmentSource.ADMIN,
      scheduledDate: tomorrow,
      scheduledTime: "12:00",
      notes: "Damat paketi teklifi sunulacak.",
    },
    {
      customerEmail: "ece.sahin@demo.local",
      serviceSlug: "fon-sekillendirme",
      staffName: null,
      status: AppointmentStatus.NEW,
      source: AppointmentSource.WEB,
      scheduledDate: tomorrow,
      scheduledTime: "15:00",
      notes: "Personel atamasi bekliyor.",
    },
    {
      customerEmail: "deniz.aksoy@demo.local",
      serviceSlug: "sac-boyama",
      staffName: "Emre Kilic",
      status: AppointmentStatus.CANCELLED,
      source: AppointmentSource.WEB,
      scheduledDate: today,
      scheduledTime: "16:00",
      notes: "Musteri seyahat nedeniyle iptal etti.",
    },
    {
      customerEmail: "deniz.aksoy@demo.local",
      serviceSlug: "cilt-bakimi",
      staffName: "Seda Ozturk",
      status: AppointmentStatus.COMPLETED,
      source: AppointmentSource.ADMIN,
      scheduledDate: twoDaysAgo,
      scheduledTime: "13:30",
      notes: "Paket hizmete ilgi gosterdi.",
      payment: { amount: 1400, method: PaymentMethod.CASH, note: "Nakit tahsil" },
    },
    {
      customerEmail: "melis.demir@demo.local",
      serviceSlug: "fon-sekillendirme",
      staffName: "Elif Aydin",
      status: AppointmentStatus.CONFIRMED,
      source: AppointmentSource.ADMIN,
      scheduledDate: dayAfterTomorrow,
      scheduledTime: "18:00",
      notes: "Etkinlik oncesi finish randevusu.",
    },
  ]

  for (const definition of appointmentDefinitions) {
    const customer = customerByEmail.get(definition.customerEmail)
    const service = serviceBySlug.get(definition.serviceSlug)
    const staff = definition.staffName ? staffByName.get(definition.staffName) : null

    const appointment = await prisma.appointment.create({
      data: {
        customerId: customer.id,
        serviceId: service.id,
        staffId: staff?.id ?? null,
        status: definition.status,
        source: definition.source,
        scheduledDate: definition.scheduledDate,
        scheduledTime: definition.scheduledTime,
        scheduledAt: toScheduledAt(definition.scheduledDate, definition.scheduledTime),
        notes: definition.notes,
      },
    })

    if (definition.payment) {
      const paidAt = new Date(`${definition.scheduledDate}T${definition.scheduledTime}:00+03:00`)
      paidAt.setHours(paidAt.getHours() + 2)

      await prisma.payment.create({
        data: {
          appointmentId: appointment.id,
          amount: definition.payment.amount,
          method: definition.payment.method,
          paidAt,
          note: definition.payment.note,
        },
      })
    }
  }
}

async function refreshLoyalty() {
  const seededCustomers = await prisma.customer.findMany({
    where: {
      email: {
        in: customers.map((customer) => customer.email),
      },
    },
    include: {
      appointments: {
        where: {
          status: AppointmentStatus.COMPLETED,
          payment: {
            isNot: null,
          },
        },
        include: {
          payment: true,
        },
      },
    },
  })

  for (const customer of seededCustomers) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        loyaltyPoints: customer.appointments.length * 20,
      },
    })
  }
}

async function main() {
  await resetDemoData()
  await upsertCoreData()

  const [serviceRecords, staffRecords, customerByEmail] = await Promise.all([
    prisma.service.findMany(),
    prisma.staff.findMany(),
    seedCustomers(),
  ])

  const serviceBySlug = new Map(serviceRecords.map((service) => [service.slug, service]))
  const staffByName = new Map(staffRecords.map((staff) => [staff.name, staff]))

  await seedPackages(serviceBySlug)
  await seedAppointments({ serviceBySlug, staffByName, customerByEmail })
  await refreshLoyalty()
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

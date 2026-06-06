import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const services = [
  {
    slug: "sac-kesim-tasarim",
    title: "Saç Kesim ve Tasarım",
    shortTitle: "Saç Kesim",
    teaser: "Yüz hatlarına ve yaşam tarzına uygun profesyonel kesim.",
    description: "Danışmanlık, yıkama ve son şekillendirme ile tamamlanan premium kesim deneyimi.",
    image: "/images/service-haircut.jpg",
    priceFrom: 250,
    priceLabel: "250 TL",
    durationMinutes: 60,
    sortOrder: 1,
    features: [
      "Kişiye özel stil önerisi",
      "Yıkama ve son şekillendirme",
      "Günlük kullanım odaklı kesim",
      "Modern tekniklerle uygulama",
    ],
  },
  {
    slug: "sac-boyama",
    title: "Saç Boyama",
    shortTitle: "Saç Boyama",
    teaser: "Canlı tonlar ve kontrollü renk geçişleri.",
    description: "Renk yenileme, tonlama ve modern boyama uygulamalarıyla yenilenmiş görünüm.",
    image: "/images/service-coloring.jpg",
    priceFrom: 400,
    priceLabel: "400 TL",
    durationMinutes: 120,
    sortOrder: 2,
    features: [
      "Ombre ve balyaj seçenekleri",
      "Renk yenileme ve tonlama",
      "Profesyonel ürün seçimi",
      "Uygulama sonrası bakım önerisi",
    ],
  },
  {
    slug: "keratin-bakimi",
    title: "Keratin Bakımı",
    shortTitle: "Keratin",
    teaser: "Yumuşaklık ve parlaklık katan yoğun bakım.",
    description: "Saç tellerini destekleyen premium keratin bakım uygulaması.",
    image: "/images/service-keratin.jpg",
    priceFrom: 800,
    priceLabel: "800 TL",
    durationMinutes: 90,
    sortOrder: 3,
    features: [
      "Parlak ve düzgün bitiş",
      "Kolay şekil alma",
      "Yumuşak doku",
      "Bakım rutini yönlendirmesi",
    ],
  },
  {
    slug: "fon-sekillendirme",
    title: "Fon ve Şekillendirme",
    shortTitle: "Fon",
    teaser: "Günlük ya da özel günler için hızlı şekillendirme.",
    description: "Bakımlı ve dengeli bir görünüm sunan profesyonel şekillendirme paketi.",
    image: "/images/service-blowdry.jpg",
    priceFrom: 150,
    priceLabel: "150 TL",
    durationMinutes: 45,
    sortOrder: 4,
    features: [
      "Günlük veya özel gün seçenekleri",
      "Düz ve hacimli bitişler",
      "Isı kontrollü uygulama",
      "Hızlı ve düzenli sonuç",
    ],
  },
  {
    slug: "kaynak-islemleri",
    title: "Kaynak İşlemleri",
    shortTitle: "Kaynak",
    teaser: "Doğal görünümlü hacim ve uzunluk kazanımı.",
    description: "Uzman yönlendirmesiyle planlanan premium kaynak uygulamaları.",
    image: "/images/service-extensions.jpg",
    priceFrom: 1500,
    priceLabel: "1.500 TL",
    durationMinutes: 180,
    sortOrder: 5,
    features: [
      "Doğal görünüm odaklı planlama",
      "Farklı teknik seçenekleri",
      "Hacim ve uzunluk kazanımı",
      "Uygulama sonrası kullanım bilgisi",
    ],
  },
]

const staffMembers = [
  {
    name: "Elif Aydın",
    role: "Kurucu ve Baş Stilist",
    bio: "Kesim, tasarım ve premium müşteri deneyimi alanında uzman.",
    avatar: "/images/team-1.jpg",
    sortOrder: 1,
  },
  {
    name: "Emre Kılıç",
    role: "Renk Uzmanı",
    bio: "Modern boyama ve geçiş tekniklerinde odaklı uzman.",
    avatar: "/images/team-2.jpg",
    sortOrder: 2,
  },
  {
    name: "Seda Öztürk",
    role: "Bakım Uzmanı",
    bio: "Bakım ve keratin uygulamalarında operasyon lideri.",
    avatar: "/images/team-3.jpg",
    sortOrder: 3,
  },
]

async function main() {
  await prisma.appointment.deleteMany({
    where: {
      customer: {
        email: "demo@bellasalon.com.tr",
      },
    },
  })

  await prisma.customer.deleteMany({
    where: {
      email: "demo@bellasalon.com.tr",
    },
  })

  await prisma.businessSettings.upsert({
    where: { id: "adakan-core-settings" },
    update: {
      businessName: "Adakan Hair Studio",
      tagline: "Salonlar İçin Premium Randevu ve Deneyim Altyapısı",
      phone: "539 941 65 21",
      email: "adakansoftware@gamil.com",
      address: "Bağdat Caddesi No:128, Caddebostan / İstanbul",
      city: "İstanbul",
      timezone: "Europe/Istanbul",
      currency: "TRY",
    },
    create: {
      id: "adakan-core-settings",
      businessName: "Adakan Hair Studio",
      tagline: "Salonlar İçin Premium Randevu ve Deneyim Altyapısı",
      phone: "539 941 65 21",
      email: "adakansoftware@gamil.com",
      address: "Bağdat Caddesi No:128, Caddebostan / İstanbul",
      city: "İstanbul",
      timezone: "Europe/Istanbul",
      currency: "TRY",
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

  await prisma.businessSettings.deleteMany({
    where: {
      id: "bella-core-settings",
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

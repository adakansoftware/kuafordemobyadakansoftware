import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const services = [
  {
    slug: "sac-kesim-tasarim",
    title: "Sac Kesim ve Tasarim",
    shortTitle: "Sac Kesim",
    teaser: "Yuz hatlarina ve yasam tarzina uygun profesyonel kesim.",
    description:
      "Danismanlik, yikama ve son sekillendirme ile tamamlanan premium kesim deneyimi.",
    image: "/images/service-haircut.jpg",
    priceFrom: 250,
    priceLabel: "250 TL",
    durationMinutes: 60,
    sortOrder: 1,
    features: [
      "Kisiye ozel stil onerisi",
      "Yikama ve son sekillendirme",
      "Gunluk kullanim odakli kesim",
      "Modern tekniklerle uygulama",
    ],
  },
  {
    slug: "sac-boyama",
    title: "Sac Boyama",
    shortTitle: "Sac Boyama",
    teaser: "Canli tonlar ve kontrollu renk gecisleri.",
    description: "Renk yenileme, tonlama ve modern boyama uygulamalariyla yenilenmis gorunum.",
    image: "/images/service-coloring.jpg",
    priceFrom: 400,
    priceLabel: "400 TL",
    durationMinutes: 120,
    sortOrder: 2,
    features: [
      "Ombre ve balyaj secenekleri",
      "Renk yenileme ve tonlama",
      "Profesyonel urun secimi",
      "Uygulama sonrasi bakim onerisi",
    ],
  },
  {
    slug: "keratin-bakimi",
    title: "Keratin Bakimi",
    shortTitle: "Keratin",
    teaser: "Yumusaklik ve parlaklik katan yogun bakim.",
    description: "Sac tellerini destekleyen premium keratin bakim uygulamasi.",
    image: "/images/service-keratin.jpg",
    priceFrom: 800,
    priceLabel: "800 TL",
    durationMinutes: 90,
    sortOrder: 3,
    features: [
      "Parlak ve duzgun bitis",
      "Kolay sekil alma",
      "Yumusak doku",
      "Bakim rutini yonlendirmesi",
    ],
  },
  {
    slug: "fon-sekillendirme",
    title: "Fon ve Sekillendirme",
    shortTitle: "Fon",
    teaser: "Gunluk ya da ozel gunler icin hizli sekillendirme.",
    description: "Bakimli ve dengeli bir gorunum sunan profesyonel sekillendirme paketi.",
    image: "/images/service-blowdry.jpg",
    priceFrom: 150,
    priceLabel: "150 TL",
    durationMinutes: 45,
    sortOrder: 4,
    features: [
      "Gunluk veya ozel gun secenekleri",
      "Duz ve hacimli bitisler",
      "Isi kontrollu uygulama",
      "Hizli ve duzenli sonuc",
    ],
  },
  {
    slug: "kaynak-islemleri",
    title: "Kaynak Islemleri",
    shortTitle: "Kaynak",
    teaser: "Dogal gorunumlu hacim ve uzunluk kazanimi.",
    description: "Uzman yonlendirmesiyle planlanan premium kaynak uygulamalari.",
    image: "/images/service-extensions.jpg",
    priceFrom: 1500,
    priceLabel: "1.500 TL",
    durationMinutes: 180,
    sortOrder: 5,
    features: [
      "Dogal gorunum odakli planlama",
      "Farkli teknik secenekleri",
      "Hacim ve uzunluk kazanimi",
      "Uygulama sonrasi kullanim bilgisi",
    ],
  },
]

const staffMembers = [
  {
    name: "Elif Aydin",
    role: "Kurucu ve Bas Stilist",
    bio: "Kesim, tasarim ve premium musteri deneyimi alaninda uzman.",
    avatar: "/images/team-1.jpg",
    sortOrder: 1,
  },
  {
    name: "Emre Kilic",
    role: "Renk Uzmani",
    bio: "Modern boyama ve gecis tekniklerinde odakli uzman.",
    avatar: "/images/team-2.jpg",
    sortOrder: 2,
  },
  {
    name: "Seda Ozturk",
    role: "Bakim Uzmani",
    bio: "Bakim ve keratin uygulamalarinda operasyon lideri.",
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
      tagline: "Salonlar Icin Premium Randevu ve Deneyim Altyapisi",
      phone: "+90 (216) 777 40 40",
      email: "info@adakan.studio",
      address: "Bagdat Caddesi No:128, Caddebostan / Istanbul",
      city: "Istanbul",
      timezone: "Europe/Istanbul",
      currency: "TRY",
    },
    create: {
      id: "adakan-core-settings",
      businessName: "Adakan Hair Studio",
      tagline: "Salonlar Icin Premium Randevu ve Deneyim Altyapisi",
      phone: "+90 (216) 777 40 40",
      email: "info@adakan.studio",
      address: "Bagdat Caddesi No:128, Caddebostan / Istanbul",
      city: "Istanbul",
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

export type NavLink = {
  href: string
  label: string
}

export type Service = {
  slug: string
  title: string
  shortTitle: string
  price: string
  teaser: string
  description: string
  image: string
  features: string[]
}

export type Testimonial = {
  name: string
  text: string
  rating: number
}

export const siteContent = {
  brand: {
    shortName: "ADAKAN",
    name: "Adakan Hair Studio",
    legalName: "Adakan Hair Studio Güzellik Hizmetleri",
    tagline: "Caddebostan'da premium saç tasarımı ve randevu deneyimi",
    heroEyebrow: "Caddebostan / İstanbul",
    heroTitle: "Güven veren salon deneyimi, güçlü saç tasarımı ve özenli bakım",
    heroDescription:
      "Adakan Hair Studio; kişiye özel saç kesimi, renk uygulamaları ve bakım ritüellerini sakin, düzenli ve premium bir salon deneyimiyle buluşturur.",
    heroHighlights: [
      "Uzman stil danışmanlığı",
      "Planlı randevu akışı",
      "Premium ürün seçkisi",
    ],
    aboutLead:
      "Adakan Hair Studio, modern saç tasarımını dikkatli analiz, profesyonel uygulama ve güçlü misafir deneyimi standartlarıyla bir araya getiren butik bir salon markasıdır.",
    aboutDescription:
      "Her ziyarette saç yapınızı, günlük rutininizi ve stil beklentinizi değerlendiriyor; sonucu yalnızca estetik açıdan değil, sürdürülebilir kullanım açısından da planlıyoruz.",
  },
  seo: {
    siteUrl: "https://adakan.studio",
    defaultTitle: "Adakan Hair Studio | Premium Saç Tasarımı ve Online Randevu",
    titleTemplate: "%s | Adakan Hair Studio",
    description:
      "Adakan Hair Studio; saç kesimi, renk uygulamaları, keratin bakımı ve şekillendirme hizmetlerini profesyonel ekip, premium ürünler ve güven veren randevu akışıyla sunar.",
    keywords: [
      "kuaför",
      "saç tasarımı",
      "saç kesimi",
      "saç boyama",
      "keratin bakımı",
      "Caddebostan kuaför",
      "İstanbul güzellik salonu",
    ],
  },
  navigation: [
    { href: "/", label: "Ana Sayfa" },
    { href: "/hizmetler", label: "Hizmetler" },
    { href: "/hakkimizda", label: "Hakkımızda" },
    { href: "/randevu", label: "Randevu" },
  ] satisfies NavLink[],
  contact: {
    phoneDisplay: "+90 (216) 777 40 40",
    phoneHref: "tel:+902167774040",
    email: "info@adakan.studio",
    address: "Bağdat Caddesi No:128, Caddebostan / İstanbul",
    city: "İstanbul",
    mapTitle: "Adakan Hair Studio konumu",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3008.8541428440346!2d28.98742!3d41.04861!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab7175e22bf43%3A0x726d431e947c8c49!2sNi%C5%9Fanta%C5%9F%C4%B1%2C%20%C5%9Ei%C5%9Fli%2F%C4%B0stanbul!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str",
    hours: [
      { label: "Pazartesi - Cumartesi", value: "09:00 - 21:00" },
      { label: "Pazar", value: "10:00 - 18:00" },
    ],
  },
  social: {
    instagram: "https://instagram.com",
    tiktok: "https://tiktok.com",
  },
  stats: [
    { value: 10, suffix: "+", label: "Yıllık Deneyim" },
    { value: 5000, suffix: "+", label: "Memnun Misafir" },
    { value: 15, suffix: "", label: "Uzman Ekip Üyesi" },
    { value: 4.9, suffix: "/5", label: "Ortalama Değerlendirme" },
  ],
  services: [
    {
      slug: "sac-kesim-tasarim",
      title: "Saç Kesim ve Tasarım",
      shortTitle: "Saç Kesim",
      price: "250 TL'den başlayan",
      teaser: "Yüz hatlarına ve kullanım alışkanlıklarınıza göre planlanan profesyonel kesim.",
      description:
        "Saç yapınız, yüz formunuz ve günlük rutininiz birlikte değerlendirilir; ölçülü danışmanlık, yıkama ve son şekillendirme ile tamamlanan net bir kesim deneyimi sunulur.",
      image: "/images/service-haircut.jpg",
      features: [
        "Kişiye özel stil danışmanlığı",
        "Yıkama ve profesyonel son dokunuş",
        "Günlük kullanıma uygun kesim planı",
        "Yüz hattına göre denge çalışması",
      ],
    },
    {
      slug: "sac-boyama",
      title: "Saç Boyama",
      shortTitle: "Saç Boyama",
      price: "400 TL'den başlayan",
      teaser: "Doğal geçişler ve kontrollü ton çalışmalarıyla dengeli renk uygulaması.",
      description:
        "Saçın mevcut durumu analiz edilerek ombre, balyaj, tonlama veya renk yenileme uygulamaları kontrollü biçimde planlanır; hedef doğal, parlak ve taşınabilir bir sonuçtur.",
      image: "/images/service-coloring.jpg",
      features: [
        "Ombre ve balyaj seçenekleri",
        "Ton eşitleme ve renk yenileme",
        "Premium ürün ve koruyucu bakım",
        "Uygulama sonrası bakım yönlendirmesi",
      ],
    },
    {
      slug: "keratin-bakimi",
      title: "Keratin Bakımı",
      shortTitle: "Keratin",
      price: "800 TL'den başlayan",
      teaser: "Parlaklık, yumuşaklık ve daha kontrollü bir saç görünümü için yoğun bakım.",
      description:
        "Yıpranma seviyesine göre planlanan keratin bakımı, saç tellerini destekleyen yoğun içeriklerle daha parlak, daha sakin ve daha kolay şekil alan bir görünüm hedefler.",
      image: "/images/service-keratin.jpg",
      features: [
        "Yoğun onarım odaklı bakım",
        "Parlak ve dengeli bitiş",
        "Kolay şekil alma desteği",
        "Ev bakım rutini önerisi",
      ],
    },
    {
      slug: "fon-sekillendirme",
      title: "Fon ve Şekillendirme",
      shortTitle: "Fon",
      price: "150 TL'den başlayan",
      teaser: "Günlük kullanım veya özel günler için temiz ve kalıcı şekillendirme.",
      description:
        "Saçın boyu, yoğunluğu ve kullanım amacı değerlendirilerek düz, hacimli veya daha hareketli bitişler hazırlanır; amaç hızlı ama özensiz olmayan bir sonuç üretmektir.",
      image: "/images/service-blowdry.jpg",
      features: [
        "Günlük ve özel gün alternatifleri",
        "Düz, hacimli veya hareketli bitişler",
        "Isı kontrollü uygulama",
        "Zamanında ve düzenli servis akışı",
      ],
    },
    {
      slug: "kaynak-islemleri",
      title: "Kaynak İşlemleri",
      shortTitle: "Kaynak",
      price: "1.500 TL'den başlayan",
      teaser: "Doğal görünüm odaklı hacim ve uzunluk çözümleri.",
      description:
        "Saç yapınıza uygun teknik seçilerek uzunluk ve hacim ihtiyacı profesyonel şekilde planlanır; konfor, doğallık ve kullanım kolaylığı önceliklendirilir.",
      image: "/images/service-extensions.jpg",
      features: [
        "Doğal görünüm hedefli planlama",
        "Farklı teknik alternatifleri",
        "Hacim ve uzunluk dengesi",
        "Uygulama sonrası kullanım bilgilendirmesi",
      ],
    },
  ] satisfies Service[],
  reasons: [
    {
      title: "Uzman Kadro",
      description: "Sürekli eğitim alan, tekniği güncel takip eden deneyimli ekip.",
    },
    {
      title: "Premium Ürünler",
      description: "Saç sağlığını koruyan güvenilir ve profesyonel ürün seçkisi.",
    },
    {
      title: "Hijyen Standardı",
      description: "Temiz, düzenli ve güven veren salon akışı.",
    },
    {
      title: "Kişiye Özel Planlama",
      description: "Her işlem saç yapısına ve beklentiye göre ayrı değerlendirilir.",
    },
    {
      title: "Sakin Deneyim",
      description: "Randevu yoğunluğu kontrollü, iletişimi net bir ziyaret süreci.",
    },
    {
      title: "Sonuç Odaklı Yaklaşım",
      description: "Gösterişli değil, sürdürülebilir ve taşınabilir sonuçlara odaklanırız.",
    },
  ],
  gallery: [
    { src: "/images/before-after-1.jpg", alt: "Saç bakım uygulaması öncesi ve sonrası" },
    { src: "/images/before-after-2.jpg", alt: "Renk uygulaması öncesi ve sonrası" },
    { src: "/images/before-after-3.jpg", alt: "Şekillendirme uygulaması öncesi ve sonrası" },
  ],
  testimonials: [
    {
      name: "Ayşe Yılmaz",
      text: "Randevu süreci çok düzenliydi. Ekip ihtiyaçlarımı iyi dinledi ve sonuç beklentimin tam karşılığını verdi.",
      rating: 5,
    },
    {
      name: "Zeynep Kara",
      text: "Keratin bakımında saçımın yapısına göre yönlendirme yapmaları çok güven vericiydi. Sonuç doğal ve bakımlı görünüyor.",
      rating: 5,
    },
    {
      name: "Elif Demir",
      text: "Renk çalışmasında ton seçimi çok başarılıydı. Salon deneyimi sakin, temiz ve profesyoneldi.",
      rating: 5,
    },
  ] satisfies Testimonial[],
  values: [
    { title: "Kaliteli Ürün", description: "Her işlemde güvenilir profesyonel ürünler kullanırız." },
    { title: "Uzman Ekip", description: "Deneyim ve teknik bilgiyi iletişim kalitesiyle birleştiririz." },
    { title: "Hijyen", description: "Salon içi düzen ve hijyen standardını tavizsiz koruruz." },
    { title: "Ölçülü Tasarım", description: "Her müşteriye yüz ve saç yapısına uygun sonuç planlarız." },
  ],
  team: [
    {
      name: "Elif Aydın",
      title: "Kurucu ve Baş Stilist",
      bio: "Kesim, tasarım ve misafir deneyimi standardı üzerinde uzmanlaşmış kurucu stilist.",
      image: "/images/team-1.jpg",
    },
    {
      name: "Emre Kılıç",
      title: "Renk Uzmanı",
      bio: "Modern renk geçişleri, ton dengeleme ve koruyucu boya uygulamalarında uzman.",
      image: "/images/team-2.jpg",
    },
    {
      name: "Seda Öztürk",
      title: "Bakım Uzmanı",
      bio: "Keratin ve yoğun bakım uygulamalarında saç yapısına uygun planlama yaklaşımıyla çalışır.",
      image: "/images/team-3.jpg",
    },
  ],
  booking: {
    introTitle: "Online randevu talebinizi birkaç adımda oluşturun",
    introDescription:
      "Uygun hizmet, tarih ve saati seçin. Ekibimiz talebinizi kontrol edip en kısa sürede teyit için sizinle iletişime geçsin.",
    notes: [
      "Randevu talepleri salon yoğunluğu ve ekip uygunluğuna göre teyit edilir.",
      "Değişiklik veya iptal için mümkünse en az 24 saat önce bilgi verilmesini rica ederiz.",
      "İlk ziyaretinizde saç geçmişinizi daha sağlıklı değerlendirebilmemiz için 5-10 dakika erken gelmeniz faydalı olur.",
    ],
    trustPoints: [
      "Gizli ve güvenli talep kaydı",
      "Aynı saat için çakışma kontrolü",
      "Net teyit ve geri dönüş akışı",
    ],
  },
  cta: {
    eyebrow: "Randevunuzu Planlayın",
    title: "Saçınız için doğru uygulamayı birlikte planlayalım",
    description:
      "Kesim, renk veya bakım ihtiyaçlarınız için ekibimizle iletişime geçin; size uygun hizmeti ve zamanı güvenle planlayalım.",
    primaryLabel: "Online Randevu Oluştur",
    secondaryLabel: "Telefonla Ulaşın",
  },
  admin: {
    statusLabels: {
      NEW: "Yeni Talep",
      CONFIRMED: "Onaylandı",
      COMPLETED: "Tamamlandı",
      CANCELLED: "İptal Edildi",
    },
  },
} as const

export function getServiceBySlug(slug: string) {
  return siteContent.services.find((service) => service.slug === slug)
}

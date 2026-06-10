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
    legalName: "Adakan Hair Studio Guzellik Hizmetleri",
    tagline: "Caddebostan'da premium sac tasarimi ve planli randevu deneyimi",
    heroEyebrow: "Caddebostan / Istanbul",
    heroTitle: "Guven veren salon deneyimi, guclu sac tasarimi ve ozenli bakim",
    heroDescription:
      "Adakan Hair Studio; kisiye ozel sac kesimi, renk uygulamalari ve bakim rituelerini sakin, duzenli ve premium bir salon deneyimiyle bulusturur.",
    heroHighlights: ["Uzman stil danismanligi", "Planli randevu akisi", "Premium urun seckisi"],
    aboutLead:
      "Adakan Hair Studio, modern sac tasarimini dikkatli analiz, profesyonel uygulama ve guclu misafir deneyimi standartlariyla bir araya getiren butik bir salon markasidir.",
    aboutDescription:
      "Her ziyarette sac yapinizi, gunluk rutininizi ve stil beklentinizi degerlendiriyor; sonucu yalnizca estetik acidan degil, surdurulebilir kullanim acisindan da planliyoruz.",
  },
  seo: {
    siteUrl: "https://adakan.studio",
    defaultTitle: "Adakan Hair Studio | Premium Sac Tasarimi ve Online Randevu",
    titleTemplate: "%s | Adakan Hair Studio",
    description:
      "Adakan Hair Studio; sac kesimi, renk uygulamalari, keratin bakimi ve sekillendirme hizmetlerini profesyonel ekip, premium urunler ve guven veren randevu akisiyla sunar.",
    keywords: [
      "kuafor",
      "sac tasarimi",
      "sac kesimi",
      "sac boyama",
      "keratin bakimi",
      "Caddebostan kuafor",
      "Istanbul guzellik salonu",
    ],
  },
  navigation: [
    { href: "/", label: "Ana Sayfa" },
    { href: "/hizmetler", label: "Hizmetler" },
    { href: "/hakkimizda", label: "Hakkimizda" },
    { href: "/randevu", label: "Randevu" },
  ] satisfies NavLink[],
  contact: {
    phoneDisplay: "539 941 65 21",
    phoneHref: "tel:+905399416521",
    email: "adakansoftware@gmail.com",
    address: "Bagdat Caddesi No:128, Caddebostan / Istanbul",
    city: "Istanbul",
    mapTitle: "Adakan Hair Studio konumu",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3008.8541428440346!2d28.98742!3d41.04861!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab7175e22bf43%3A0x726d431e947c8c49!2sCaddebostan%2C%20Kadikoy%2FIstanbul!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str",
    hours: [
      { label: "Pazartesi - Cumartesi", value: "09:00 - 21:00" },
      { label: "Pazar", value: "10:00 - 18:00" },
    ],
  },
  social: {
    instagram: "",
    tiktok: "",
  },
  stats: [
    { value: 10, suffix: "+", label: "Yillik Deneyim" },
    { value: 5000, suffix: "+", label: "Memnun Misafir" },
    { value: 15, suffix: "", label: "Uzman Ekip Uyesi" },
    { value: 4.9, suffix: "/5", label: "Ortalama Degerlendirme" },
  ],
  services: [
    {
      slug: "sac-kesim-tasarim",
      title: "Sac Kesim ve Tasarim",
      shortTitle: "Sac Kesim",
      price: "250 TL'den baslayan",
      teaser: "Yuz hatlarina ve kullanim aliskanliklariniza gore planlanan profesyonel kesim.",
      description:
        "Sac yapiniz, yuz formunuz ve gunluk rutininiz birlikte degerlendirilir; olculu danismanlik, yikama ve son sekillendirme ile tamamlanan net bir kesim deneyimi sunulur.",
      image: "/images/service-haircut.jpg",
      features: [
        "Kisiye ozel stil danismanligi",
        "Yikama ve profesyonel son dokunus",
        "Gunluk kullanima uygun kesim plani",
        "Yuz hattina gore denge calismasi",
      ],
    },
    {
      slug: "sac-boyama",
      title: "Sac Boyama",
      shortTitle: "Sac Boyama",
      price: "400 TL'den baslayan",
      teaser: "Dogal gecisler ve kontrollu ton calismalariyla dengeli renk uygulamasi.",
      description:
        "Sacin mevcut durumu analiz edilerek ombre, balyaj, tonlama veya renk yenileme uygulamalari kontrollu bicimde planlanir; hedef dogal, parlak ve tasinabilir bir sonuctur.",
      image: "/images/service-coloring.jpg",
      features: [
        "Ombre ve balyaj secenekleri",
        "Ton esitleme ve renk yenileme",
        "Premium urun ve koruyucu bakim",
        "Uygulama sonrasi bakim yonlendirmesi",
      ],
    },
    {
      slug: "keratin-bakimi",
      title: "Keratin Bakimi",
      shortTitle: "Keratin",
      price: "800 TL'den baslayan",
      teaser: "Parlaklik, yumusaklik ve daha kontrollu bir sac gorunumu icin yogun bakim.",
      description:
        "Yipranma seviyesine gore planlanan keratin bakimi, sac tellerini destekleyen yogun iceriklerle daha parlak, daha sakin ve daha kolay sekil alan bir gorunum hedefler.",
      image: "/images/service-keratin.jpg",
      features: [
        "Yogun onarim odakli bakim",
        "Parlak ve dengeli bitis",
        "Kolay sekil alma destegi",
        "Ev bakim rutini onerisi",
      ],
    },
    {
      slug: "fon-sekillendirme",
      title: "Fon ve Sekillendirme",
      shortTitle: "Fon",
      price: "150 TL'den baslayan",
      teaser: "Gunluk kullanim veya ozel gunler icin temiz ve kalici sekillendirme.",
      description:
        "Sacin boyu, yogunlugu ve kullanim amaci degerlendirilerek duz, hacimli veya daha hareketli bitisler hazirlanir; amac hizli ama ozensiz olmayan bir sonuc uretmektir.",
      image: "/images/service-blowdry.jpg",
      features: [
        "Gunluk ve ozel gun alternatifleri",
        "Duz, hacimli veya hareketli bitisler",
        "Isi kontrollu uygulama",
        "Zamaninda ve duzenli servis akisi",
      ],
    },
    {
      slug: "kaynak-islemleri",
      title: "Kaynak Islemleri",
      shortTitle: "Kaynak",
      price: "1.500 TL'den baslayan",
      teaser: "Dogal gorunum odakli hacim ve uzunluk cozumleri.",
      description:
        "Sac yapiniza uygun teknik secilerek uzunluk ve hacim ihtiyaci profesyonel sekilde planlanir; konfor, dogallik ve kullanim kolayligi onceliklendirilir.",
      image: "/images/service-extensions.jpg",
      features: [
        "Dogal gorunum hedefli planlama",
        "Farkli teknik alternatifleri",
        "Hacim ve uzunluk dengesi",
        "Uygulama sonrasi kullanim bilgilendirmesi",
      ],
    },
  ] satisfies Service[],
  reasons: [
    { title: "Uzman Kadro", description: "Surekli egitim alan, teknigi guncel takip eden deneyimli ekip." },
    { title: "Premium Urunler", description: "Sac sagligini koruyan guvenilir ve profesyonel urun seckisi." },
    { title: "Hijyen Standardi", description: "Temiz, duzenli ve guven veren salon akisi." },
    { title: "Kisiye Ozel Planlama", description: "Her islem sac yapisina ve beklentiye gore ayri degerlendirilir." },
    { title: "Sakin Deneyim", description: "Randevu yogunlugu kontrollu, iletisimi net bir ziyaret sureci." },
    { title: "Sonuc Odakli Yaklasim", description: "Gosterisli degil, surdurulebilir ve tasinabilir sonuclara odaklaniriz." },
  ],
  gallery: [
    { src: "/images/before-after-1.jpg", alt: "Sac bakim uygulamasi oncesi ve sonrasi" },
    { src: "/images/before-after-2.jpg", alt: "Renk uygulamasi oncesi ve sonrasi" },
    { src: "/images/before-after-3.jpg", alt: "Sekillendirme uygulamasi oncesi ve sonrasi" },
  ],
  testimonials: [
    {
      name: "Ayse Yilmaz",
      text: "Randevu sureci cok duzenliydi. Ekip ihtiyaclarimi iyi dinledi ve sonuc beklentimin tam karsiligini verdi.",
      rating: 5,
    },
    {
      name: "Zeynep Kara",
      text: "Keratin bakiminda sacimin yapisina gore yonlendirme yapmalari cok guven vericiydi. Sonuc dogal ve bakimli gorunuyor.",
      rating: 5,
    },
    {
      name: "Elif Demir",
      text: "Renk calismasinda ton secimi cok basariliydi. Salon deneyimi sakin, temiz ve profesyoneldi.",
      rating: 5,
    },
  ] satisfies Testimonial[],
  values: [
    { title: "Kaliteli Urun", description: "Her islemde guvenilir profesyonel urunler kullaniriz." },
    { title: "Uzman Ekip", description: "Deneyim ve teknik bilgiyi iletisim kalitesiyle birlestiririz." },
    { title: "Hijyen", description: "Salon ici duzen ve hijyen standardini tavizsiz koruruz." },
    { title: "Olculu Tasarim", description: "Her musteriye yuz ve sac yapisina uygun sonuc planlariz." },
  ],
  team: [
    {
      name: "Elif Aydin",
      title: "Kurucu ve Bas Stilist",
      bio: "Kesim, tasarim ve misafir deneyimi standardi uzerinde uzmanlasmis kurucu stilist.",
      image: "/images/team-1.jpg",
    },
    {
      name: "Emre Kilic",
      title: "Renk Uzmani",
      bio: "Modern renk gecisleri, ton dengeleme ve koruyucu boya uygulamalarinda uzman.",
      image: "/images/team-2.jpg",
    },
    {
      name: "Seda Ozturk",
      title: "Bakim Uzmani",
      bio: "Keratin ve yogun bakim uygulamalarinda sac yapisina uygun planlama yaklasimiyla calisir.",
      image: "/images/team-3.jpg",
    },
  ],
  booking: {
    introTitle: "Online randevu talebinizi birkac adimda olusturun",
    introDescription:
      "Uygun hizmet, tarih ve saati secin. Ekibimiz talebinizi kontrol edip en kisa surede teyit icin sizinle iletisime gecsin.",
    notes: [
      "Randevu talepleri salon yogunlugu ve ekip uygunluguna gore teyit edilir.",
      "Degisiklik veya iptal icin mumkunse en az 24 saat once bilgi verilmesini rica ederiz.",
      "Ilk ziyaretinizde sac gecmisinizi daha saglikli degerlendirebilmemiz icin 5-10 dakika erken gelmeniz faydali olur.",
    ],
    trustPoints: ["Gizli ve guvenli talep kaydi", "Ayni saat icin cakisma kontrolu", "Net teyit ve geri donus akisi"],
  },
  cta: {
    eyebrow: "Randevunuzu Planlayin",
    title: "Saciniz icin dogru uygulamayi birlikte planlayalim",
    description:
      "Kesim, renk veya bakim ihtiyaclariniz icin ekibimizle iletisime gecin; size uygun hizmeti ve zamani guvenle planlayalim.",
    primaryLabel: "Online Randevu Olustur",
    secondaryLabel: "Telefonla Ulasin",
  },
  admin: {
    statusLabels: {
      NEW: "Yeni Talep",
      CONFIRMED: "Onaylandi",
      COMPLETED: "Tamamlandi",
      CANCELLED: "Iptal Edildi",
    },
  },
} as const

export function getServiceBySlug(slug: string) {
  return siteContent.services.find((service) => service.slug === slug)
}

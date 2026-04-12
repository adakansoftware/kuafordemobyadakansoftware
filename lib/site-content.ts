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
    name: "BELLA",
    title: "Bella Sac ve Guzellik Salonu",
    tagline: "Premium Sac ve Guzellik Salonu",
    heroTitle: "Gorunusunuzu Guclendiren Premium Deneyim",
    heroDescription:
      "Istanbul'un merkezinde, uzman ekip ve modern tekniklerle dogal, bakimli ve guven veren bir salon deneyimi sunuyoruz.",
    aboutLead:
      "Bella, Nisantasi merkezli premium bir sac ve guzellik salonu olarak kiseye ozel uygulamalari, guclu ekip yapisi ve dikkatli hizmet standardi ile one cikar.",
  },
  navigation: [
    { href: "/", label: "Ana Sayfa" },
    { href: "/hizmetler", label: "Hizmetler" },
    { href: "/hakkimizda", label: "Hakkimizda" },
    { href: "/randevu", label: "Randevu" },
  ] satisfies NavLink[],
  contact: {
    phoneDisplay: "+90 (212) 555 00 88",
    phoneHref: "tel:+902125550088",
    email: "info@bellasalon.com.tr",
    address: "Nisantasi Mah. Abdi Ipekci Cad. No:42, Sisli / Istanbul",
    mapTitle: "Bella Salon Konum",
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
    { value: 10, suffix: "+", label: "Yillik Deneyim" },
    { value: 5000, suffix: "+", label: "Mutlu Musteri" },
    { value: 15, suffix: "", label: "Uzman Ekip Uyesi" },
    { value: 4.9, suffix: "", label: "Ortalama Degerlendirme", prefix: "*" },
  ],
  services: [
    {
      slug: "sac-kesim-tasarim",
      title: "Sac Kesim ve Tasarim",
      shortTitle: "Sac Kesim",
      price: "250 TL",
      teaser: "Yuz hatlariniza ve tarz hedefinize uygun profesyonel kesim.",
      description:
        "Yuz seklinize, gunluk aliskanliklariniza ve stil beklentinize uygun profesyonel kesim uygulamasi. Danismanlik, yikama ve son dokunuslar tek bir deneyimde birlesir.",
      image: "/images/service-haircut.jpg",
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
      price: "400 TL",
      teaser: "Canli tonlar ve kontrollu renk gecisleriyle yenilenmis gorunum.",
      description:
        "Dogal gecisler, canli tonlar ve profesyonel renk planlamasi ile istediginiz gorunume kontrollu sekilde ulasmanizi saglar.",
      image: "/images/service-coloring.jpg",
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
      price: "800 TL",
      teaser: "Yumusaklik, parlaklik ve daha kolay sekil alan saclar.",
      description:
        "Sac tellerini destekleyen yogun bakim uygulamasi ile daha parlak, yumusak ve duzenli bir gorunum hedeflenir.",
      image: "/images/service-keratin.jpg",
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
      price: "150 TL",
      teaser: "Gunluk ya da ozel gunlere uygun hizli ve etkili sekillendirme.",
      description:
        "Gunluk kullanima ya da etkinliklere uygun sekillendirme secenekleri ile bakimli ve dengeli bir gorunum sunar.",
      image: "/images/service-blowdry.jpg",
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
      price: "1.500 TL",
      teaser: "Dogal gorunumlu uzunluk ve hacim kazanimi.",
      description:
        "Dogal gorunumlu hacim ve uzunluk hedefleyen kaynak uygulamalari, uzman yonlendirmesiyle en uygun teknik secilerek planlanir.",
      image: "/images/service-extensions.jpg",
      features: [
        "Dogal gorunum odakli planlama",
        "Farkli teknik secenekleri",
        "Hacim ve uzunluk kazanimi",
        "Uygulama sonrasi kullanim bilgisi",
      ],
    },
  ] satisfies Service[],
  reasons: [
    {
      title: "Uzman Kadro",
      description: "Surekli egitim alan, deneyimli profesyonel ekip.",
    },
    {
      title: "Premium Urunler",
      description: "Sac sagligi icin kaliteli ve guvenilir urun secimi.",
    },
    {
      title: "Hijyen Garantisi",
      description: "Temiz, duzenli ve guvenli bir salon deneyimi.",
    },
    {
      title: "Kisiye Ozel Bakim",
      description: "Ihtiyaciniza ve hedefinize uygun bakim planlari.",
    },
    {
      title: "Musteri Memnuniyeti",
      description: "Sadik musteri kitlesi ve guclu memnuniyet orani.",
    },
    {
      title: "Modern Ekipman",
      description: "Yeni nesil araclar ve tekniklerle kaliteli sonuc.",
    },
  ],
  gallery: [
    { src: "/images/before-after-1.jpg", alt: "Sac bakim once ve sonra 1" },
    { src: "/images/before-after-2.jpg", alt: "Sac boyama once ve sonra" },
    { src: "/images/before-after-3.jpg", alt: "Sac sekillendirme once ve sonra" },
  ],
  testimonials: [
    {
      name: "Ayse Yilmaz",
      text: "Bella Salon ile saclarim daha bakimli ve canli gorunuyor. Ekip cok ilgili.",
      rating: 5,
    },
    {
      name: "Zeynep Kara",
      text: "Keratin bakimi sonrasi saclarim yumusak ve duzenli hale geldi.",
      rating: 5,
    },
    {
      name: "Elif Demir",
      text: "Renk secimi ve uygulama sureci cok profesyoneldi. Sonuctan cok memnunum.",
      rating: 5,
    },
  ] satisfies Testimonial[],
  values: [
    { title: "Kaliteli Urun", description: "Guvenilir ve profesyonel urun secimi." },
    { title: "Uzman Ekip", description: "Deneyimli ve surekli gelisen kadro." },
    { title: "Hijyen", description: "Temiz ve guvenli salon ortami." },
    { title: "Modern Ekipman", description: "Yeni nesil araclar ve teknikler." },
  ],
  team: [
    {
      name: "Elif Aydin",
      title: "Kurucu ve Bas Stilist",
      bio: "Kesim ve tasarim alaninda deneyimli kurucu stilist.",
      image: "/images/team-1.jpg",
    },
    {
      name: "Emre Kilic",
      title: "Renk Uzmani",
      bio: "Modern boyama tekniklerinde uzman ekip uyesi.",
      image: "/images/team-2.jpg",
    },
    {
      name: "Seda Ozturk",
      title: "Bakim Uzmani",
      bio: "Bakim ve keratin uygulamalarinda odakli uzman.",
      image: "/images/team-3.jpg",
    },
  ],
  cta: {
    eyebrow: "Hemen Baslayin",
    title: "Yeni Gorunume Bir Adim Kaldi",
    description:
      "Uzman ekibimizle tanismak ve size ozel bakim programi olusturmak icin hemen randevu alin.",
  },
} as const

export function getServiceBySlug(slug: string) {
  return siteContent.services.find((service) => service.slug === slug)
}

import { siteContent } from "./site-content.ts"

export function getHomePageViewModel() {
  return {
    hero: {
      eyebrow: siteContent.brand.heroEyebrow,
      title: siteContent.brand.heroTitle,
      description: siteContent.brand.heroDescription,
      highlights: [...siteContent.brand.heroHighlights],
      tagline: siteContent.brand.tagline,
      primaryCtaLabel: "Randevu Olustur",
      primaryCtaHref: "/randevu",
      secondaryCtaLabel: "Hizmetleri Incele",
      secondaryCtaHref: "/hizmetler",
      noteTitle: "Salon Notu",
      noteDescription:
        "Ilk temastan son dokunusa kadar net iletisim, duzenli operasyon ve profesyonel sac tasarimi odagini birlikte koruyoruz.",
      metrics: [
        { value: "09:00 - 21:00", label: "Hafta ici ve cumartesi calisma saatleri" },
        { value: "4.9/5", label: "Ortalama misafir degerlendirmesi" },
        { value: "15 kisilik", label: "Alaninda uzman ekip yapilanmasi" },
      ],
    },
    stats: [...siteContent.stats],
    intro: {
      eyebrow: "Marka Hakkinda",
      title: "Sac tasarimini guvenli surec ve olculu estetikle bulusturuyoruz",
      lead: siteContent.brand.aboutLead,
      description: siteContent.brand.aboutDescription,
      highlights: [
        {
          title: "Kisiye ozel",
          description: "Yuz hatti, sac yapisi ve kullanim aliskanligi birlikte degerlendirilir.",
        },
        {
          title: "Premium",
          description: "Urun secimi, uygulama disiplini ve misafir iletisimi ayni cizgide ilerler.",
        },
      ],
    },
    reasons: {
      eyebrow: "Farkimiz",
      title: "Neden Adakan Hair Studio?",
      description: "Hizmet kalitesini yalnizca sonucla degil, surec disiplini ve iletisim guveniyle birlikte ele aliyoruz.",
      items: [...siteContent.reasons],
    },
    featuredServices: {
      eyebrow: "Hizmetlerimiz",
      title: "En cok talep goren hizmetler",
      description: "Salon ici en sik tercih edilen uygulamalari, net fiyat baslangiclari ve kisa icerikleriyle inceleyin.",
      items: siteContent.services.slice(0, 3),
      allServicesHref: "/hizmetler",
      allServicesLabel: "Tum hizmetleri goruntule",
      bookingHref: "/randevu",
      bookingLabel: "Bu hizmet icin talep olustur",
    },
    gallery: {
      eyebrow: "Galeri",
      title: "Oncesi ve sonrasi",
      description: "Uygulama disiplinimizi ve elde edilen sonuclari gorsel orneklerle inceleyin.",
      items: [...siteContent.gallery],
    },
    testimonials: {
      eyebrow: "Misafir Yorumlari",
      title: "Misafirlerimiz deneyimi nasil anlatiyor?",
      items: [...siteContent.testimonials],
    },
    cta: {
      eyebrow: siteContent.cta.eyebrow,
      title: siteContent.cta.title,
      description: siteContent.cta.description,
      primaryLabel: siteContent.cta.primaryLabel,
      primaryHref: "/randevu",
      secondaryLabel: siteContent.cta.secondaryLabel,
      secondaryHref: siteContent.contact.phoneHref,
    },
  }
}

export function getBookingPageViewModel() {
  return {
    eyebrow: "Randevu",
    title: "Online randevu olusturun",
    description: siteContent.booking.introDescription,
    contact: { ...siteContent.contact },
    notes: [...siteContent.booking.notes],
    trustPoints: [...siteContent.booking.trustPoints],
  }
}

export function getServicesPageViewModel() {
  return {
    eyebrow: "Hizmetlerimiz",
    title: "Premium sac bakim hizmetleri",
    description: "Her uygulamayi sac yapiniza, kullanim aliskanliginiza ve hedef sonuca gore planliyoruz.",
    services: [...siteContent.services],
    bookingHref: "/randevu",
    bookingLabel: "Bu hizmet icin randevu olustur",
  }
}

export function getAboutPageViewModel() {
  return {
    eyebrow: "Hakkimizda",
    title: "Hikayemiz",
    description: "Butik salon deneyimini teknik uzmanlik, sakin iletisim ve ozenli bakim anlayisiyla birlestiriyoruz.",
    leadTitle: "Guzellige ozenli ve profesyonel bir yaklasim",
    aboutLead: siteContent.brand.aboutLead,
    aboutDescription: siteContent.brand.aboutDescription,
    valuesEyebrow: "Degerlerimiz",
    valuesTitle: "Temel degerlerimiz",
    values: [...siteContent.values],
    team: [...siteContent.team],
    ctaTitle: "Ekibimizle tanismak ister misiniz?",
    ctaDescription: "Ihtiyaciniza uygun hizmeti birlikte planlamak icin hemen randevu talebinizi olusturun.",
    ctaHref: "/randevu",
    ctaLabel: "Randevu olustur",
  }
}

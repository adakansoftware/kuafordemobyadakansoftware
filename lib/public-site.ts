import { siteContent } from "@/lib/site-content"

export function getHomePageViewModel() {
  return {
    hero: {
      eyebrow: siteContent.brand.heroEyebrow,
      title: siteContent.brand.heroTitle,
      description: siteContent.brand.heroDescription,
      highlights: [...siteContent.brand.heroHighlights],
      tagline: siteContent.brand.tagline,
      primaryCtaLabel: "Randevu Oluştur",
      primaryCtaHref: "/randevu",
      secondaryCtaLabel: "Hizmetleri İncele",
      secondaryCtaHref: "/hizmetler",
      noteTitle: "Salon Notu",
      noteDescription:
        "İlk temastan son dokunuşa kadar net iletişim, düzenli operasyon ve profesyonel saç tasarımı odağını birlikte koruyoruz.",
      metrics: [
        { value: "09:00 - 21:00", label: "Hafta içi ve cumartesi çalışma saatleri" },
        { value: "4.9/5", label: "Ortalama misafir değerlendirmesi" },
        { value: "15 kişilik", label: "Alanında uzman ekip yapılanması" },
      ],
    },
    stats: [...siteContent.stats],
    intro: {
      eyebrow: "Marka Hakkında",
      title: "Saç tasarımını güvenli süreç ve ölçülü estetikle buluşturuyoruz",
      lead: siteContent.brand.aboutLead,
      description: siteContent.brand.aboutDescription,
      highlights: [
        {
          title: "Kişiye özel",
          description: "Yüz hattı, saç yapısı ve kullanım alışkanlığı birlikte değerlendirilir.",
        },
        {
          title: "Premium",
          description: "Ürün seçimi, uygulama disiplini ve misafir iletişimi aynı çizgide ilerler.",
        },
      ],
    },
    reasons: {
      eyebrow: "Farkımız",
      title: "Neden Adakan Hair Studio?",
      description: "Hizmet kalitesini yalnızca sonuçla değil, süreç disiplini ve iletişim güveniyle birlikte ele alıyoruz.",
      items: [...siteContent.reasons],
    },
    featuredServices: {
      eyebrow: "Hizmetlerimiz",
      title: "En çok talep gören hizmetler",
      description: "Salon içi en sık tercih edilen uygulamaları, net fiyat başlangıçları ve kısa içerikleriyle inceleyin.",
      items: siteContent.services.slice(0, 3),
      allServicesHref: "/hizmetler",
      allServicesLabel: "Tüm hizmetleri görüntüle",
      bookingHref: "/randevu",
      bookingLabel: "Bu hizmet için talep oluştur",
    },
    gallery: {
      eyebrow: "Galeri",
      title: "Öncesi ve sonrası",
      description: "Uygulama disiplinimizi ve elde edilen sonuçları görsel örneklerle inceleyin.",
      items: [...siteContent.gallery],
    },
    testimonials: {
      eyebrow: "Misafir Yorumları",
      title: "Misafirlerimiz deneyimi nasıl anlatıyor?",
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
    title: "Online randevu oluşturun",
    description: siteContent.booking.introDescription,
    contact: { ...siteContent.contact },
    notes: [...siteContent.booking.notes],
    trustPoints: [...siteContent.booking.trustPoints],
  }
}

export function getServicesPageViewModel() {
  return {
    eyebrow: "Hizmetlerimiz",
    title: "Premium saç bakım hizmetleri",
    description: "Her uygulamayı saç yapınıza, kullanım alışkanlığınıza ve hedef sonuca göre planlıyoruz.",
    services: [...siteContent.services],
    bookingHref: "/randevu",
    bookingLabel: "Bu hizmet için randevu oluştur",
  }
}

export function getAboutPageViewModel() {
  return {
    eyebrow: "Hakkımızda",
    title: "Hikayemiz",
    description: "Butik salon deneyimini teknik uzmanlık, sakin iletişim ve özenli bakım anlayışıyla birleştiriyoruz.",
    leadTitle: "Güzelliğe özenli ve profesyonel bir yaklaşım",
    aboutLead: siteContent.brand.aboutLead,
    aboutDescription: siteContent.brand.aboutDescription,
    valuesEyebrow: "Değerlerimiz",
    valuesTitle: "Temel değerlerimiz",
    values: [...siteContent.values],
    team: [...siteContent.team],
    ctaTitle: "Ekibimizle tanışmak ister misiniz?",
    ctaDescription: "İhtiyacınıza uygun hizmeti birlikte planlamak için hemen randevu talebinizi oluşturun.",
    ctaHref: "/randevu",
    ctaLabel: "Randevu oluştur",
  }
}

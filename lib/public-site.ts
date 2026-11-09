import type { Locale } from "./i18n/validation.ts"
import { getSiteContent } from "./content/index.ts"

export function getHomePageViewModel(locale: Locale = "tr") {
  const content = getSiteContent(locale)

  return {
    hero: {
      eyebrow: content.brand.heroEyebrow,
      title: content.brand.heroTitle,
      description: content.brand.heroDescription,
      highlights: [...content.brand.heroHighlights],
      tagline: content.brand.tagline,
      primaryCtaLabel: content.pages.home.hero.primaryCtaLabel,
      primaryCtaHref: "/randevu",
      secondaryCtaLabel: content.pages.home.hero.secondaryCtaLabel,
      secondaryCtaHref: "/hizmetler",
      noteTitle: content.pages.home.hero.noteTitle,
      noteDescription: content.pages.home.hero.noteDescription,
      metrics: content.pages.home.hero.metrics.map((metric) => ({ ...metric })),
    },
    stats: [...content.stats],
    intro: {
      eyebrow: content.pages.home.intro.eyebrow,
      title: content.pages.home.intro.title,
      lead: content.brand.aboutLead,
      description: content.brand.aboutDescription,
      highlights: content.pages.home.intro.highlights.map((highlight) => ({ ...highlight })),
    },
    reasons: {
      eyebrow: content.pages.home.reasons.eyebrow,
      title: content.pages.home.reasons.title,
      description: content.pages.home.reasons.description,
      items: [...content.reasons],
    },
    featuredServices: {
      eyebrow: content.pages.home.featuredServices.eyebrow,
      title: content.pages.home.featuredServices.title,
      description: content.pages.home.featuredServices.description,
      items: content.services.slice(0, 3).map((service) => ({ ...service })),
      allServicesHref: "/hizmetler",
      allServicesLabel: content.pages.home.featuredServices.allServicesLabel,
      bookingHref: "/randevu",
      bookingLabel: content.pages.home.featuredServices.bookingLabel,
    },
    gallery: {
      eyebrow: content.pages.home.gallery.eyebrow,
      title: content.pages.home.gallery.title,
      description: content.pages.home.gallery.description,
      items: [...content.gallery],
    },
    testimonials: {
      eyebrow: content.pages.home.testimonials.eyebrow,
      title: content.pages.home.testimonials.title,
      items: [...content.testimonials],
    },
    faq: {
      eyebrow: content.pages.home.faq.eyebrow,
      title: content.pages.home.faq.title,
      description: content.pages.home.faq.description,
      items: content.pages.home.faq.items.map((item) => ({ ...item })),
    },
    cta: {
      eyebrow: content.cta.eyebrow,
      title: content.cta.title,
      description: content.cta.description,
      primaryLabel: content.cta.primaryLabel,
      primaryHref: "/randevu",
      secondaryLabel: content.cta.secondaryLabel,
      secondaryHref: content.contact.phoneHref,
    },
  }
}

export function getBookingPageViewModel(locale: Locale = "tr") {
  const content = getSiteContent(locale)

  return {
    eyebrow: content.pages.booking.eyebrow,
    title: content.pages.booking.title,
    description: content.booking.introDescription,
    contact: { ...content.contact },
    notes: [...content.booking.notes],
    trustPoints: [...content.booking.trustPoints],
  }
}

export function getServicesPageViewModel(locale: Locale = "tr") {
  const content = getSiteContent(locale)

  return {
    eyebrow: content.pages.services.eyebrow,
    title: content.pages.services.title,
    description: content.pages.services.description,
    services: [...content.services],
    bookingHref: "/randevu",
    bookingLabel: content.pages.services.bookingLabel,
  }
}

export function getAboutPageViewModel(locale: Locale = "tr") {
  const content = getSiteContent(locale)

  return {
    eyebrow: content.pages.about.eyebrow,
    title: content.pages.about.title,
    description: content.pages.about.description,
    leadTitle: content.pages.about.leadTitle,
    aboutLead: content.brand.aboutLead,
    aboutDescription: content.brand.aboutDescription,
    valuesEyebrow: content.pages.about.valuesEyebrow,
    valuesTitle: content.pages.about.valuesTitle,
    values: [...content.values],
    team: [...content.team],
    ctaTitle: content.pages.about.ctaTitle,
    ctaDescription: content.pages.about.ctaDescription,
    ctaHref: "/randevu",
    ctaLabel: content.pages.about.ctaLabel,
  }
}

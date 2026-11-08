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

export type Stat = {
  value: number
  suffix: string
  label: string
}

export type Reason = {
  title: string
  description: string
}

export type GalleryItem = {
  src: string
  alt: string
}

export type TeamMember = {
  name: string
  title: string
  bio: string
  image: string
}

export type Value = {
  title: string
  description: string
}

export type OpeningHour = {
  label: string
  value: string
}

export type AppointmentStatusKey = "NEW" | "CONFIRMED" | "COMPLETED" | "CANCELLED"

export type HomeHeroMetric = {
  value: string
  label: string
}

export type IntroHighlight = {
  title: string
  description: string
}

export type SiteContent = {
  brand: {
    shortName: string
    name: string
    legalName: string
    tagline: string
    heroEyebrow: string
    heroTitle: string
    heroDescription: string
    heroHighlights: string[]
    aboutLead: string
    aboutDescription: string
  }
  seo: {
    siteUrl: string
    defaultTitle: string
    titleTemplate: string
    description: string
    keywords: string[]
  }
  navigation: NavLink[]
  contact: {
    phoneDisplay: string
    phoneHref: string
    email: string
    address: string
    city: string
    mapTitle: string
    mapEmbed: string
    hours: OpeningHour[]
  }
  social: {
    instagram: string
    tiktok: string
  }
  stats: Stat[]
  services: Service[]
  reasons: Reason[]
  gallery: GalleryItem[]
  testimonials: Testimonial[]
  values: Value[]
  team: TeamMember[]
  booking: {
    introTitle: string
    introDescription: string
    notes: string[]
    trustPoints: string[]
  }
  cta: {
    eyebrow: string
    title: string
    description: string
    primaryLabel: string
    secondaryLabel: string
  }
  admin: {
    statusLabels: Record<AppointmentStatusKey, string>
  }
  pages: {
    home: {
      hero: {
        primaryCtaLabel: string
        secondaryCtaLabel: string
        noteTitle: string
        noteDescription: string
        metrics: HomeHeroMetric[]
      }
      intro: {
        eyebrow: string
        title: string
        highlights: IntroHighlight[]
      }
      reasons: {
        eyebrow: string
        title: string
        description: string
      }
      featuredServices: {
        eyebrow: string
        title: string
        description: string
        allServicesLabel: string
        bookingLabel: string
      }
      gallery: {
        eyebrow: string
        title: string
        description: string
      }
      testimonials: {
        eyebrow: string
        title: string
      }
    }
    booking: {
      eyebrow: string
      title: string
      seoTitle: string
      seoDescription: string
    }
    services: {
      eyebrow: string
      title: string
      description: string
      bookingLabel: string
      seoTitle: string
      seoDescription: string
    }
    about: {
      eyebrow: string
      title: string
      description: string
      leadTitle: string
      valuesEyebrow: string
      valuesTitle: string
      ctaTitle: string
      ctaDescription: string
      ctaLabel: string
      seoTitle: string
      seoDescription: string
    }
    footer: {
      headline: string
    }
  }
}

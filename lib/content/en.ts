import type { SiteContent } from "./types.ts"

export const siteContentEn: SiteContent = {
  brand: {
    shortName: "ADAKAN",
    name: "Adakan Hair Studio",
    legalName: "Adakan Hair Studio Beauty Services",
    tagline: "Premium hair design and well-planned appointment experience in Caddebostan",
    heroEyebrow: "Caddebostan / Istanbul",
    heroTitle: "A salon experience you can trust, strong hair design and careful care",
    heroDescription:
      "Adakan Hair Studio brings personalized haircuts, color treatments and care rituals together with a calm, orderly and premium salon experience.",
    heroHighlights: ["Expert style consulting", "Planned appointment flow", "Premium product selection"],
    aboutLead:
      "Adakan Hair Studio is a boutique salon brand that combines modern hair design with careful analysis, professional application and strong guest experience standards.",
    aboutDescription:
      "At every visit we assess your hair structure, daily routine and style expectations; we plan the outcome not only from an aesthetic perspective but also for sustainable wear.",
  },
  seo: {
    siteUrl: "https://adakan.studio",
    defaultTitle: "Adakan Hair Studio | Premium Hair Design and Online Booking",
    titleTemplate: "%s | Adakan Hair Studio",
    description:
      "Adakan Hair Studio offers haircuts, color treatments, keratin care and styling services with a professional team, premium products and a trustworthy appointment flow.",
    keywords: [
      "hair salon",
      "hair design",
      "haircut",
      "hair coloring",
      "keratin treatment",
      "Caddebostan hair salon",
      "Istanbul beauty salon",
    ],
  },
  navigation: [
    { href: "/", label: "Home" },
    { href: "/hizmetler", label: "Services" },
    { href: "/hakkimizda", label: "About" },
    { href: "/randevu", label: "Booking" },
  ],
  contact: {
    phoneDisplay: "539 941 65 21",
    phoneHref: "tel:+905399416521",
    email: "adakansoftware@gmail.com",
    address: "Bagdat Street No:128, Caddebostan / Istanbul",
    city: "Istanbul",
    mapTitle: "Adakan Hair Studio location",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3008.8541428440346!2d28.98742!3d41.04861!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab7175e22bf43%3A0x726d431e947c8c49!2sCaddebostan%2C%20Kadikoy%2FIstanbul!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str",
    hours: [
      { label: "Monday - Saturday", value: "09:00 - 21:00" },
      { label: "Sunday", value: "10:00 - 18:00" },
    ],
  },
  social: {
    instagram: "https://instagram.com/adakanhairstudio",
    tiktok: "https://tiktok.com/@adakanhairstudio",
  },
  stats: [
    { value: 10, suffix: "+", label: "Years of Experience" },
    { value: 5000, suffix: "+", label: "Happy Guests" },
    { value: 15, suffix: "", label: "Expert Team Members" },
    { value: 4.9, suffix: "/5", label: "Average Rating" },
  ],
  services: [
    {
      slug: "sac-kesim-tasarim",
      title: "Haircut and Design",
      shortTitle: "Haircut",
      price: "Starting from 950 TRY",
      teaser: "A professional cut planned around your facial features and daily habits.",
      description:
        "Your hair structure, face shape and daily routine are evaluated together; a complete cutting experience is delivered with style consulting, washing, the right choice of scissors and razor techniques, and final styling. The cut plan respects the natural fall of your hair and a shape you can maintain at home.",
      image: "/images/service-haircut.jpg",
      features: [
        "Personal style consulting",
        "Balance work around your face line",
        "Wash and scalp care",
        "Right choice of scissors and razor techniques",
        "A cut plan suited to daily use",
        "Professional finishing touch and styling",
      ],
    },
    {
      slug: "sac-boyama",
      title: "Hair Coloring",
      shortTitle: "Coloring",
      price: "Starting from 2,200 TRY",
      teaser: "Balanced color application with natural transitions and controlled tone work.",
      description:
        "The current state of your hair is analyzed and ombre, balayage, root color, toning or color renewal applications are planned in a controlled way. When needed, a color test is done before the application; the process runs with premium products that protect hair health. The goal is a natural, bright and wearable result.",
      image: "/images/service-coloring.jpg",
      features: [
        "Ombre and balayage options",
        "Tone equalizing and color renewal",
        "Root color and retouch applications",
        "Pre-color test when needed",
        "Premium products and protective care",
        "Post-treatment care guidance",
      ],
    },
    {
      slug: "keratin-bakimi",
      title: "Keratin Treatment",
      shortTitle: "Keratin",
      price: "Starting from 2,800 TRY",
      teaser: "Intensive care for shine, softness and a more controlled hair look.",
      description:
        "Planned according to your level of wear, the keratin treatment aims for a brighter, calmer and easier-to-style look with intensive formulas that support the hair strands. Application steps are adjusted section by section to your hair structure; what to watch in the first days after the treatment and your home care routine are explained in detail.",
      image: "/images/service-keratin.jpg",
      features: [
        "Planning based on level of wear",
        "Intensive repair-focused care",
        "Frizz and static control",
        "Bright and balanced finish",
        "Support for easier styling",
        "Home care routine recommendations",
      ],
    },
    {
      slug: "fon-sekillendirme",
      title: "Blowout and Styling",
      shortTitle: "Styling",
      price: "Starting from 400 TRY",
      teaser: "Clean and lasting styling for daily use or special days.",
      description:
        "Straight, voluminous or wavy finishes are prepared by evaluating your hair length, density and purpose of use. Blow-dry, curling iron and straightener techniques are supported with heat-protective products; the aim is a fast yet careful result you can carry all day.",
      image: "/images/service-blowdry.jpg",
      features: [
        "Daily and special day alternatives",
        "Straight, voluminous or wavy finishes",
        "Blow-dry, curling iron and straightener techniques",
        "Heat-protective product use",
        "Heat-controlled application",
        "Timely and orderly service flow",
      ],
    },
    {
      slug: "kaynak-islemleri",
      title: "Hair Extensions",
      shortTitle: "Extensions",
      price: "Starting from 1,800 TRY",
      teaser: "Natural-looking volume and length solutions.",
      description:
        "The technique suited to your hair structure is selected and your length and volume needs are planned professionally. Your color and hair thickness guide the extension choice; with a post-application care set and regular check-in appointments, naturalness and everyday comfort are preserved.",
      image: "/images/service-extensions.jpg",
      features: [
        "Natural-look-focused planning",
        "Different technique alternatives",
        "Tone selection matched to your color",
        "Volume and length balance",
        "Post-application care set recommendation",
        "Regular check-in and renewal plan",
      ],
    },
  ],
  reasons: [
    {
      title: "Expert Team",
      description:
        "An experienced team in continuous training that follows current techniques. Each specialist goes deep in their own field — cutting, color or care.",
    },
    {
      title: "Premium Products",
      description:
        "A reliable and professional product selection that protects hair health. We share the series used in every application with each guest.",
    },
    {
      title: "Hygiene Standard",
      description:
        "A clean, orderly and trustworthy salon flow. Tool sterilization after every guest is applied without compromise.",
    },
    {
      title: "Personal Planning",
      description:
        "Every treatment is evaluated separately according to hair structure, face shape and expectations. We make a personal plan, not a template.",
    },
    {
      title: "Calm Experience",
      description:
        "A visit process with controlled appointment density and clear communication. Time spent in the waiting area stays planned.",
    },
    {
      title: "Result-Oriented Approach",
      description:
        "We focus on sustainable and wearable results, not flashy ones. We aim for a finish you can recreate at home.",
    },
  ],
  gallery: [
    { src: "/images/before-after-1.jpg", alt: "Hair care application before and after" },
    { src: "/images/before-after-2.jpg", alt: "Color application before and after" },
    { src: "/images/before-after-3.jpg", alt: "Styling application before and after" },
    { src: "/images/service-coloring.jpg", alt: "Natural color transitions with balayage application" },
    { src: "/images/service-keratin.jpg", alt: "Bright and balanced look after keratin treatment" },
    { src: "/images/service-blowdry.jpg", alt: "Everyday polished finish with blowout and styling" },
  ],
  testimonials: [
    {
      name: "Ayşe Yılmaz",
      text: "The appointment process was very orderly. The team listened to my needs well and the result fully met my expectations. The cut styles just as easily at home.",
      rating: 5,
    },
    {
      name: "Zeynep Kara",
      text: "Their guidance based on my hair structure during the keratin treatment was very reassuring. The result looks natural and well cared for, and the static is completely gone.",
      rating: 5,
    },
    {
      name: "Elif Demir",
      text: "The tone selection in the color work was excellent. We're planning a slightly cooler tone for the root color in the next session. The salon experience was calm and professional.",
      rating: 4,
    },
    {
      name: "Merve Şahin",
      text: "I received detailed information before the extension application, which removed all my hesitation. Thanks to the after-care recommendations, my extensions still look like day one.",
      rating: 5,
    },
    {
      name: "Deniz Aksoy",
      text: "I went in for a blowout before a special event; the wavy finish was exactly what I wanted and it held all night. They started on time and finished on time.",
      rating: 5,
    },
    {
      name: "Selin Yıldız",
      text: "On my first visit they asked about my hair history carefully and never rushed. A good overall experience; I'm thinking of trying balayage next time.",
      rating: 4,
    },
  ],
  values: [
    { title: "Quality Products", description: "We use reliable professional products for every treatment." },
    { title: "Expert Team", description: "We combine experience and technical knowledge with communication quality." },
    { title: "Hygiene", description: "We protect the in-salon order and hygiene standard without compromise." },
    { title: "Measured Design", description: "We plan a result suited to each guest's face and hair structure." },
  ],
  team: [
    {
      name: "Elif Aydın",
      title: "Founder and Lead Stylist",
      bio: "Founder stylist specialized in cutting, design and guest experience standards.",
      image: "/images/team-1.jpg",
    },
    {
      name: "Emre Kılıç",
      title: "Color Specialist",
      bio: "Expert in modern color transitions, tone balancing and protective coloring applications.",
      image: "/images/team-2.jpg",
    },
    {
      name: "Seda Öztürk",
      title: "Care Specialist",
      bio: "Works with a hair-structure-appropriate planning approach in keratin and intensive care applications.",
      image: "/images/team-3.jpg",
    },
  ],
  booking: {
    introTitle: "Create your online appointment request in a few steps",
    introDescription:
      "Choose a suitable service, date and time. Our team will review your request and contact you as soon as possible to confirm.",
    notes: [
      "Appointment requests are confirmed based on salon density and team availability.",
      "For changes or cancellations, we kindly ask you to give at least 24 hours' notice when possible.",
      "On your first visit, arriving 5-10 minutes early helps us assess your hair history more healthily.",
      "If you are more than 15 minutes late, the application duration may be shortened or the appointment rescheduled.",
      "For coloring and color treatments, we may request a color test completed within the last 48 hours due to sensitivity risk.",
    ],
    trustPoints: [
      "Confidential and secure request recording",
      "Conflict check for the same time slot",
      "Clear confirmation and follow-up flow",
      "Request with contact details only — no payment information",
    ],
  },
  cta: {
    eyebrow: "Plan Your Appointment",
    title: "Let's plan the right treatment for your hair together",
    description:
      "Contact our team for your cutting, color or care needs; let's confidently plan the service and time that suits you.",
    primaryLabel: "Create an Online Appointment",
    secondaryLabel: "Reach Us by Phone",
  },
  admin: {
    statusLabels: {
      NEW: "New Request",
      CONFIRMED: "Confirmed",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    },
  },
  pages: {
    home: {
      hero: {
        primaryCtaLabel: "Book an Appointment",
        secondaryCtaLabel: "Explore Services",
        noteTitle: "Salon Note",
        noteDescription:
          "From first contact to the final touch, we keep clear communication, orderly operations and a professional hair design focus together.",
        metrics: [
          { value: "09:00 - 21:00", label: "Weekday and Saturday opening hours" },
          { value: "4.9/5", label: "Average guest rating" },
          { value: "15 people", label: "Expert team structure" },
        ],
      },
      intro: {
        eyebrow: "About the Brand",
        title: "Bringing hair design together with a safe process and measured aesthetics",
        highlights: [
          {
            title: "Personalized",
            description:
              "Face line, hair structure and usage habits are evaluated together; the result is planned for you.",
          },
          {
            title: "Premium",
            description:
              "Product selection, application discipline and guest communication progress on the same line; details are never small.",
          },
        ],
      },
      reasons: {
        eyebrow: "Our Difference",
        title: "Why Adakan Hair Studio?",
        description:
          "We approach service quality not only through results but together with process discipline and communication trust.",
      },
      featuredServices: {
        eyebrow: "Our Services",
        title: "Most requested services",
        description:
          "Review the most frequently preferred in-salon applications with clear starting prices and brief content.",
        allServicesLabel: "View all services",
        bookingLabel: "Create a request for this service",
      },
      gallery: {
        eyebrow: "Gallery",
        title: "Before and after",
        description:
          "Review our application discipline and the results achieved with visual examples; every frame is real guest work.",
      },
      testimonials: {
        eyebrow: "Guest Reviews",
        title: "How do our guests describe the experience?",
      },
      faq: {
        eyebrow: "Frequently Asked Questions",
        title: "What guests ask most",
        description:
          "We answered the most frequently asked questions about the appointment process, pricing policy and post-treatment care.",
        items: [
          {
            question: "How do I book an appointment and when is it confirmed?",
            answer:
              "You can submit your request through the online booking form by choosing a service, date and time. Your request is checked against salon density and team availability; we contact you as soon as possible to confirm. Conflicting time slots are automatically blocked by the system.",
          },
          {
            question: "How are prices determined?",
            answer:
              "The starting price of each service is clearly stated. The exact price, which depends on hair length, density and the scope of the application, is shared during the consultation before the treatment; there are no surprise costs.",
          },
          {
            question: "How should I care for my hair after coloring?",
            answer:
              "For the first 48 hours, avoid shampoos without color protection and wash your hair with lukewarm water. We recommend sulfate-free, color-protecting products; the right series visibly extends color longevity.",
          },
          {
            question: "How long does a keratin treatment last?",
            answer:
              "Depending on your hair structure and home care routine, it typically lasts 3-4 months. Using a sulfate-free shampoo and rinsing after sea and pool sessions are the most important factors that extend its duration.",
          },
          {
            question: "How should I care for my hair extensions?",
            answer:
              "Avoid brushing your hair while wet at the extension bonds, braid loosely before sleeping and use the recommended care set. A check-in appointment is scheduled every 6-8 weeks for extension health.",
          },
          {
            question: "What happens on my first visit?",
            answer:
              "We start with a short conversation about your hair history, habits and expectations. Then a hair analysis and treatment plan are shared with you. That's why we kindly ask you to arrive 5-10 minutes early for your first appointment.",
          },
          {
            question: "What payment options are available?",
            answer:
              "You can pay in cash or by credit card. Payment is taken after the service is completed and you approve the result; no payment information is requested for an appointment request.",
          },
          {
            question: "What should I do if I need to cancel my appointment?",
            answer:
              "For changes or cancellations, we kindly ask you to notify us at least 24 hours in advance when possible. This lets us offer your slot to another guest who needs it.",
          },
        ],
      },
    },
    booking: {
      eyebrow: "Booking",
      title: "Create an online appointment",
      seoTitle: "Online Booking",
      seoDescription:
        "Create an online appointment request for Adakan Hair Studio and plan a suitable service and time in a few steps.",
    },
    services: {
      eyebrow: "Our Services",
      title: "Premium hair care services",
      description: "We plan every application according to your hair structure, usage habits and target result.",
      bookingLabel: "Book this service",
      seoTitle: "Services",
      seoDescription:
        "Explore haircuts, coloring, keratin treatments, styling and hair extensions with professional service details.",
    },
    about: {
      eyebrow: "About",
      title: "Our Story",
      description: "We combine the boutique salon experience with technical expertise, calm communication and careful care.",
      seoTitle: "About Us",
      seoDescription: "Get to know the Adakan Hair Studio team, our service approach and salon values closely.",
      leadTitle: "A careful and professional approach to beauty",
      valuesEyebrow: "Our Values",
      valuesTitle: "Our core values",
      ctaTitle: "Would you like to meet our team?",
      ctaDescription: "Create your appointment request now to plan the service that suits your needs together.",
      ctaLabel: "Book an appointment",
    },
    footer: {
      headline: "Let's turn your hair care and design process into a calm, planned and trusting experience.",
    },
  },
}

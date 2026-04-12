"use client"

import { useState, useTransition } from "react"
import { CalendarDays, CheckCircle2, Clock, Mail, Phone, User } from "lucide-react"
import { submitBookingAction } from "@/app/randevu/actions"
import {
  bookingServiceSlugs,
  bookingTimeSlots,
  getBookingMinDate,
  type BookingFieldErrors,
  type BookingFormDraft,
  validateBookingForm,
} from "@/lib/booking"
import { siteContent } from "@/lib/site-content"
import { cn } from "@/lib/utils"

type ConfirmationState = {
  bookingId: string
  serviceTitle: string
  date: string
  time: string
  name: string
}

export function BookingForm() {
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<BookingFieldErrors>({})
  const [formMessage, setFormMessage] = useState("")
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null)
  const [formData, setFormData] = useState<BookingFormDraft>({
    service: bookingServiceSlugs[0],
    date: "",
    time: "",
    name: "",
    phone: "",
    email: "",
  })

  const minDate = getBookingMinDate()
  const selectedService =
    siteContent.services.find((service) => service.slug === formData.service) ?? siteContent.services[0]

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setFormMessage("")

    const result = validateBookingForm(formData)

    if (!result.success) {
      setErrors(result.errors)
      return
    }

    setErrors({})

    startTransition(async () => {
      const response = await submitBookingAction(formData)

      if (!response.success) {
        setErrors((response.errors ?? {}) as BookingFieldErrors)
        setFormMessage(response.message)
        return
      }

      setConfirmation({
        bookingId: response.bookingId,
        serviceTitle: response.serviceTitle,
        date: response.date,
        time: response.time,
        name: response.name,
      })
      setFormMessage(response.message)
      setSubmitted(true)
    })
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-border bg-card p-12 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </div>
        <h3 className="mt-6 font-serif text-2xl font-bold text-foreground">Randevu talebiniz alındı</h3>
        <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
          Sayın <span className="font-medium text-foreground">{confirmation?.name}</span>, talebiniz başarıyla
          kaydedildi. Ekibimiz planlamayı teyit etmek için en kısa sürede sizinle iletişime geçecek.
        </p>
        {formMessage ? <p className="mt-2 text-sm text-accent">{formMessage}</p> : null}
        <div className="mt-6 rounded-[1.5rem] bg-secondary p-4">
          <div className="grid gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">Hizmet:</span>{" "}
              <span className="font-medium text-foreground">{confirmation?.serviceTitle}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Tarih:</span>{" "}
              <span className="font-medium text-foreground">{confirmation?.date}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Saat:</span>{" "}
              <span className="font-medium text-foreground">{confirmation?.time}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Talep No:</span>{" "}
              <span className="font-medium text-foreground">{confirmation?.bookingId}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setSubmitted(false)
            setFormData({ service: bookingServiceSlugs[0], date: "", time: "", name: "", phone: "", email: "" })
            setErrors({})
            setFormMessage("")
            setConfirmation(null)
          }}
          className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all duration-200 hover:opacity-90"
        >
          Yeni talep oluştur
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-border bg-card p-8 shadow-sm md:p-10">
      <div className="grid gap-6">
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-foreground">{siteContent.booking.introTitle}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{siteContent.booking.introDescription}</p>
        </div>

        <div>
          <label htmlFor="service" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarDays className="h-4 w-4 text-accent" /> Hizmet seçimi
          </label>
          <select
            id="service"
            name="service"
            value={formData.service}
            onChange={handleChange}
            required
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          >
            {siteContent.services.map((service) => (
              <option key={service.slug} value={service.slug}>
                {service.title}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-muted-foreground">{selectedService.teaser}</p>
          {errors.service ? <p className="mt-2 text-sm text-destructive">{errors.service}</p> : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarDays className="h-4 w-4 text-accent" /> Tarih seçimi
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              min={minDate}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
            {errors.date ? <p className="mt-2 text-sm text-destructive">{errors.date}</p> : null}
          </div>
          <div>
            <label htmlFor="time" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-accent" /> Saat seçimi
            </label>
            <select
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="" disabled>
                Saat seçin
              </option>
              {bookingTimeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            {errors.time ? <p className="mt-2 text-sm text-destructive">{errors.time}</p> : null}
          </div>
        </div>

        <div>
          <label htmlFor="name" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <User className="h-4 w-4 text-accent" /> Ad Soyad
          </label>
          <input
            type="text"
            id="name"
            name="name"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            required
            maxLength={80}
            placeholder="Adınızı ve soyadınızı girin"
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
          {errors.name ? <p className="mt-2 text-sm text-destructive">{errors.name}</p> : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Phone className="h-4 w-4 text-accent" /> Telefon
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              autoComplete="tel"
              inputMode="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              maxLength={20}
              placeholder="05XX XXX XX XX"
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
            {errors.phone ? <p className="mt-2 text-sm text-destructive">{errors.phone}</p> : null}
          </div>
          <div>
            <label htmlFor="email" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Mail className="h-4 w-4 text-accent" /> E-posta
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="ornek@email.com"
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
            {errors.email ? <p className="mt-2 text-sm text-destructive">{errors.email}</p> : null}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "mt-2 w-full rounded-full bg-primary px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-all duration-200 hover:opacity-90",
            isPending && "cursor-not-allowed opacity-70"
          )}
        >
          {isPending ? "Talep kaydediliyor..." : "Randevu talebi oluştur"}
        </button>

        {formMessage && !submitted ? (
          <p className="text-sm text-destructive" aria-live="polite">
            {formMessage}
          </p>
        ) : null}
      </div>
    </form>
  )
}

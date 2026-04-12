"use client"

import { useState } from "react"
import { bookingServiceSlugs, bookingTimeSlots, type BookingFieldErrors, type BookingFormDraft, getBookingMinDate, validateBookingForm } from "@/lib/booking"
import { siteContent } from "@/lib/site-content"
import { cn } from "@/lib/utils"
import { CalendarDays, Clock, User, Phone, Mail, CheckCircle2 } from "lucide-react"

export function BookingForm() {
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<BookingFieldErrors>({})
  const [formData, setFormData] = useState<BookingFormDraft>({
    service: bookingServiceSlugs[0],
    date: "",
    time: "",
    name: "",
    phone: "",
    email: "",
  })

  const minDate = getBookingMinDate()
  const selectedService = siteContent.services.find((service) => service.slug === formData.service)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const result = validateBookingForm(formData)

    if (!result.success) {
      setErrors(result.errors)
      return
    }

    setErrors({})
    setSubmitted(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-8 w-8 text-accent" />
        </div>
        <h3 className="mt-6 font-serif text-2xl font-bold text-foreground">Randevunuz Alindi!</h3>
        <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
          Sayin <span className="font-medium text-foreground">{formData.name}</span>, randevunuz basariyla olusturuldu. Ekibimiz planlamayi teyit etmek icin en kisa surede sizinle iletisime gececek.
        </p>
        <div className="mt-6 rounded-lg bg-secondary p-4">
          <div className="grid gap-2 text-sm">
            <p><span className="text-muted-foreground">Hizmet:</span> <span className="font-medium text-foreground">{selectedService?.title ?? formData.service}</span></p>
            <p><span className="text-muted-foreground">Tarih:</span> <span className="font-medium text-foreground">{formData.date}</span></p>
            <p><span className="text-muted-foreground">Saat:</span> <span className="font-medium text-foreground">{formData.time}</span></p>
          </div>
        </div>
        <button
          onClick={() => {
            setSubmitted(false)
            setFormData({ service: bookingServiceSlugs[0], date: "", time: "", name: "", phone: "", email: "" })
            setErrors({})
          }}
          className="mt-8 rounded-sm bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:opacity-90"
        >
          Yeni Randevu Al
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-8 md:p-10">
      <div className="grid gap-6">
        <div>
          <label htmlFor="service" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarDays className="h-4 w-4 text-accent" /> Hizmet Secimi
          </label>
          <select id="service" name="service" value={formData.service} onChange={handleChange} required className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent">
            {siteContent.services.map((service) => <option key={service.slug} value={service.slug}>{service.title}</option>)}
          </select>
          {errors.service ? <p className="mt-2 text-sm text-destructive">{errors.service}</p> : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarDays className="h-4 w-4 text-accent" /> Tarih Secimi
            </label>
            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required min={minDate} className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent" />
            {errors.date ? <p className="mt-2 text-sm text-destructive">{errors.date}</p> : null}
          </div>
          <div>
            <label htmlFor="time" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-accent" /> Saat Secimi
            </label>
            <select id="time" name="time" value={formData.time} onChange={handleChange} required className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent">
              <option value="" disabled>Saat secin</option>
              {bookingTimeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            </select>
            {errors.time ? <p className="mt-2 text-sm text-destructive">{errors.time}</p> : null}
          </div>
        </div>

        <div>
          <label htmlFor="name" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <User className="h-4 w-4 text-accent" /> Ad Soyad
          </label>
          <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Adinizi ve soyadinizi girin" className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent" />
          {errors.name ? <p className="mt-2 text-sm text-destructive">{errors.name}</p> : null}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Phone className="h-4 w-4 text-accent" /> Telefon
            </label>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required placeholder="05XX XXX XX XX" className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent" />
            {errors.phone ? <p className="mt-2 text-sm text-destructive">{errors.phone}</p> : null}
          </div>
          <div>
            <label htmlFor="email" className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Mail className="h-4 w-4 text-accent" /> E-posta
            </label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="ornek@email.com" className="w-full rounded-sm border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent" />
            {errors.email ? <p className="mt-2 text-sm text-destructive">{errors.email}</p> : null}
          </div>
        </div>

        <button type="submit" className={cn("mt-2 w-full rounded-sm bg-primary px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-all duration-200 hover:opacity-90")}>
          Randevuyu Onayla
        </button>
      </div>
    </form>
  )
}

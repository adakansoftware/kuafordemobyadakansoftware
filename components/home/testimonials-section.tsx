"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { siteContent } from "@/lib/site-content"
import { cn } from "@/lib/utils"

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0)
  const testimonials = siteContent.testimonials
  const testimonialCount = testimonials.length

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonialCount)
  }, [testimonialCount])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + testimonialCount) % testimonialCount)
  }, [testimonialCount])

  useEffect(() => {
    const interval = setInterval(next, 5000)
    return () => clearInterval(interval)
  }, [next])

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Musteri Yorumlari
          </p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-foreground md:text-4xl text-balance">
            Musterilerimiz Ne Diyor?
          </h2>
        </div>

        <div className="relative mt-16">
          <div className="mx-auto max-w-3xl overflow-hidden">
            <div className="rounded-lg border border-border bg-card p-8 text-center md:p-12">
              <div className="mb-6 flex items-center justify-center gap-1">
                {Array.from({ length: testimonials[current].rating }).map((_, index) => (
                  <Star key={index} className="h-5 w-5 fill-accent text-accent" />
                ))}
              </div>

              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                {`\"${testimonials[current].text}\"`}
              </p>

              <p className="mt-6 font-serif text-lg font-semibold text-foreground">
                {testimonials[current].name}
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground"
              aria-label="Onceki yorum"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    index === current ? "w-8 bg-accent" : "w-2 bg-border hover:bg-muted-foreground"
                  )}
                  aria-label={`Yorum ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground"
              aria-label="Sonraki yorum"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

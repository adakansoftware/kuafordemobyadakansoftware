"use client"

import { useEffect, useRef, useState } from "react"

type StatItem = {
  value: number
  suffix: string
  label: string
}

function AnimatedNumber({
  value,
  suffix,
  prefix,
}: {
  value: number
  suffix: string
  prefix?: string
}) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 2000
          const start = performance.now()
          const isDecimal = value % 1 !== 0

          const animate = (currentTime: number) => {
            const elapsed = currentTime - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = eased * value

            setDisplay(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current))

            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }

          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [value])

  return (
    <div ref={ref} className="font-serif text-4xl font-bold text-foreground md:text-5xl">
      {prefix}
      {display.toLocaleString("tr-TR")}
      {suffix}
    </div>
  )
}

export function StatsSection({ stats }: { stats: StatItem[] }) {
  return (
    <section className="border-b border-border bg-secondary py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              <p className="mt-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

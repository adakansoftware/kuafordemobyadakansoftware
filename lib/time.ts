export const SALON_TIMEZONE = "Europe/Istanbul"

// Türkiye 2016'dan beri kalıcı UTC+03:00 (yaz saati yok).
export const SALON_UTC_OFFSET = "+03:00"

export function salonOffsetString() {
  return SALON_UTC_OFFSET
}

export function salonDateTimeToUtc(date: string, time: string) {
  return new Date(`${date}T${time}:00${SALON_UTC_OFFSET}`)
}

export function salonDayRange(date: string) {
  return {
    start: new Date(`${date}T00:00:00${SALON_UTC_OFFSET}`),
    end: new Date(`${date}T23:59:59.999${SALON_UTC_OFFSET}`),
  }
}

export function formatSalonDateIso(instant: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SALON_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant)
}

export function salonDayOfWeek(date: string) {
  const day = salonDateTimeToUtc(date, "12:00").getDay()
  return day === 0 ? 7 : day
}

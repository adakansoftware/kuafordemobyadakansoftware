import { formatSalonDateIso, salonDayRange } from "./time.ts"

export class ReportRangeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ReportRangeError"
  }
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MAX_REPORT_RANGE_DAYS = 366

function createUtcDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`)
}

export function isIsoDateOnly(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return false
  }

  const date = createUtcDate(value)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function normalizeReportDateRange(input: { from: string; to: string }) {
  const from = input.from.trim()
  const to = input.to.trim()

  if (!isIsoDateOnly(from) || !isIsoDateOnly(to)) {
    throw new ReportRangeError("Rapor tarihleri YYYY-MM-DD formatında olmalıdır.")
  }

  const fromDate = createUtcDate(from)
  const toDate = createUtcDate(to)

  if (fromDate.getTime() > toDate.getTime()) {
    throw new ReportRangeError("Başlangıç tarihi bitiş tarihinden sonra olamaz.")
  }

  const rangeDays = Math.floor((toDate.getTime() - fromDate.getTime()) / 86_400_000) + 1

  if (rangeDays > MAX_REPORT_RANGE_DAYS) {
    throw new ReportRangeError("Rapor araligi en fazla 366 gun olabilir.")
  }

  return {
    from,
    to,
    rangeDays,
  }
}

export function toReportWindow(input: { from: string; to: string }) {
  const normalized = normalizeReportDateRange(input)

  const fromRange = salonDayRange(normalized.from)
  const toRange = salonDayRange(normalized.to)

  return {
    ...normalized,
    fromDateTime: fromRange.start,
    toDateTime: toRange.end,
  }
}

export function getTodayInIstanbulDate() {
  return formatSalonDateIso()
}

export function resolveSafeReportDateRange(input: { from?: string | null; to?: string | null; fallbackDate?: string }) {
  const fallbackDate = input.fallbackDate ?? getTodayInIstanbulDate()
  const draft = {
    from: input.from?.trim() || fallbackDate,
    to: input.to?.trim() || fallbackDate,
  }

  try {
    return normalizeReportDateRange(draft)
  } catch {
    return normalizeReportDateRange({
      from: fallbackDate,
      to: fallbackDate,
    })
  }
}

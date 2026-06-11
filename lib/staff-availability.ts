import { hasAppointmentWindowOverlap, type AppointmentWindowInput } from "./booking-rules.ts"

export type StaffAvailabilityWindow = {
  dayOfWeek: number
  startTime: string
  endTime: string
  breakStartTime?: string | null
  breakEndTime?: string | null
  isActive: boolean
}

export type StaffTimeOffWindow = {
  startDate: string
  endDate: string
  isAllDay: boolean
  startTime?: string | null
  endTime?: string | null
}

export type StaffScheduleSnapshot = {
  staffId: string
  isActive: boolean
  availabilities: StaffAvailabilityWindow[]
  timeOff: StaffTimeOffWindow[]
}

export function getDayOfWeekForDate(date: string) {
  const day = new Date(`${date}T12:00:00+03:00`).getDay()
  return day === 0 ? 7 : day
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map((value) => Number(value))
  return hours * 60 + minutes
}

export function doesWindowFitRange(startTime: string, durationMinutes: number, rangeStart: string, rangeEnd: string) {
  const start = timeToMinutes(startTime)
  const end = start + durationMinutes
  return start >= timeToMinutes(rangeStart) && end <= timeToMinutes(rangeEnd)
}

export function isStaffAvailableForWindow(
  staff: StaffScheduleSnapshot,
  candidate: AppointmentWindowInput
) {
  if (!staff.isActive) {
    return false
  }

  const dayOfWeek = getDayOfWeekForDate(candidate.scheduledDate)
  const workingWindow = staff.availabilities.find(
    (availability) => availability.isActive && availability.dayOfWeek === dayOfWeek
  )

  if (!workingWindow) {
    return false
  }

  if (!doesWindowFitRange(candidate.scheduledTime, candidate.durationMinutes, workingWindow.startTime, workingWindow.endTime)) {
    return false
  }

  if (
    workingWindow.breakStartTime &&
    workingWindow.breakEndTime &&
    hasAppointmentWindowOverlap(candidate, {
      scheduledDate: candidate.scheduledDate,
      scheduledTime: workingWindow.breakStartTime,
      durationMinutes: Math.max(timeToMinutes(workingWindow.breakEndTime) - timeToMinutes(workingWindow.breakStartTime), 30),
    })
  ) {
    return false
  }

  return !staff.timeOff.some((timeOff) => {
    if (candidate.scheduledDate < timeOff.startDate || candidate.scheduledDate > timeOff.endDate) {
      return false
    }

    if (timeOff.isAllDay) {
      return true
    }

    if (!timeOff.startTime || !timeOff.endTime) {
      return true
    }

    return hasAppointmentWindowOverlap(candidate, {
      scheduledDate: candidate.scheduledDate,
      scheduledTime: timeOff.startTime,
      durationMinutes: Math.max(timeToMinutes(timeOff.endTime) - timeToMinutes(timeOff.startTime), 30),
    })
  })
}

export function countAvailableStaffForSlot(input: {
  staff: StaffScheduleSnapshot[]
  bookings: Array<AppointmentWindowInput & { staffId?: string | null }>
  candidate: AppointmentWindowInput
}) {
  return input.staff.filter((staffMember) => {
    if (!isStaffAvailableForWindow(staffMember, input.candidate)) {
      return false
    }

    const conflictingBooking = input.bookings.some(
      (booking) =>
        booking.staffId === staffMember.staffId &&
        hasAppointmentWindowOverlap(input.candidate, {
          scheduledDate: booking.scheduledDate,
          scheduledTime: booking.scheduledTime,
          durationMinutes: booking.durationMinutes,
        })
    )

    return !conflictingBooking
  }).length
}

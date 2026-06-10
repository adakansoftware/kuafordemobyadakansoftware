import { bookingTimeSlots } from "./booking.ts"

export type AppointmentWindowInput = {
  scheduledDate: string
  scheduledTime: string
  durationMinutes: number
}

export type StaffScheduleConflictCandidate = AppointmentWindowInput & {
  id: string
  customer: {
    name: string
  }
}

const SLOT_DURATION_MINUTES = 30

function createScheduledAt(date: string, time: string) {
  return new Date(`${date}T${time}:00+03:00`)
}

function getScheduledRange(window: AppointmentWindowInput) {
  const start = createScheduledAt(window.scheduledDate, window.scheduledTime)
  const end = new Date(start.getTime() + Math.max(window.durationMinutes, SLOT_DURATION_MINUTES) * 60 * 1000)

  return { start, end }
}

export function hasAppointmentWindowOverlap(left: AppointmentWindowInput, right: AppointmentWindowInput) {
  const leftRange = getScheduledRange(left)
  const rightRange = getScheduledRange(right)

  return leftRange.start < rightRange.end && rightRange.start < leftRange.end
}

export function getOverlappingSlotTimes(date: string, time: string, durationMinutes: number) {
  return bookingTimeSlots.filter((slot) =>
    hasAppointmentWindowOverlap(
      {
        scheduledDate: date,
        scheduledTime: time,
        durationMinutes,
      },
      {
        scheduledDate: date,
        scheduledTime: slot,
        durationMinutes: SLOT_DURATION_MINUTES,
      }
    )
  )
}

export function calculatePublicAvailability(
  date: string,
  activeStaffCount: number,
  bookings: AppointmentWindowInput[]
) {
  const capacity = Math.max(activeStaffCount, 1)

  return {
    date,
    capacity,
    slots: bookingTimeSlots.map((time) => {
      const booked = bookings.filter((appointment) =>
        hasAppointmentWindowOverlap(
          {
            scheduledDate: date,
            scheduledTime: time,
            durationMinutes: SLOT_DURATION_MINUTES,
          },
          appointment
        )
      ).length

      return {
        time,
        booked,
        available: Math.max(capacity - booked, 0),
        isAvailable: booked < capacity,
      }
    }),
  }
}

export function findStaffScheduleConflict(
  appointments: StaffScheduleConflictCandidate[],
  candidate: AppointmentWindowInput
) {
  return (
    appointments.find((appointment) =>
      hasAppointmentWindowOverlap(candidate, {
        scheduledDate: appointment.scheduledDate,
        scheduledTime: appointment.scheduledTime,
        durationMinutes: appointment.durationMinutes,
      })
    ) ?? null
  )
}

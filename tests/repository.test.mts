import assert from "node:assert/strict"
import { assertMatchingCustomerIdentity, CustomerIdentityConflictError } from "../lib/customer-identity.ts"
import { calculatePublicAvailability, findStaffScheduleConflict, getOverlappingSlotTimes, hasAppointmentWindowOverlap } from "../lib/booking-rules.ts"

export function runRepositoryTests() {
  const identityConflict = new CustomerIdentityConflictError("Kimlik cakismasi")
  assert.equal(identityConflict.name, "CustomerIdentityConflictError")
  assert.equal(identityConflict.message, "Kimlik cakismasi")

  assert.doesNotThrow(() =>
    assertMatchingCustomerIdentity({
      emailCustomerId: "customer_1",
      phoneCustomerId: "customer_1",
    })
  )

  assert.throws(
    () =>
      assertMatchingCustomerIdentity({
        emailCustomerId: "customer_1",
        phoneCustomerId: "customer_2",
      }),
    CustomerIdentityConflictError
  )

  assert.equal(
    hasAppointmentWindowOverlap(
      {
        scheduledDate: "2099-06-06",
        scheduledTime: "10:00",
        durationMinutes: 60,
      },
      {
        scheduledDate: "2099-06-06",
        scheduledTime: "10:30",
        durationMinutes: 30,
      }
    ),
    true
  )

  assert.equal(
    hasAppointmentWindowOverlap(
      {
        scheduledDate: "2099-06-06",
        scheduledTime: "10:00",
        durationMinutes: 30,
      },
      {
        scheduledDate: "2099-06-06",
        scheduledTime: "10:30",
        durationMinutes: 30,
      }
    ),
    false
  )

  assert.deepEqual(getOverlappingSlotTimes("2099-06-06", "10:00", 90), ["10:00", "10:30", "11:00"])

  const availability = calculatePublicAvailability("2099-06-06", 2, [
    {
      scheduledDate: "2099-06-06",
      scheduledTime: "10:00",
      durationMinutes: 60,
    },
    {
      scheduledDate: "2099-06-06",
      scheduledTime: "10:30",
      durationMinutes: 30,
    },
  ])

  const tenAM = availability.slots.find((slot) => slot.time === "10:00")
  const tenThirty = availability.slots.find((slot) => slot.time === "10:30")
  const elevenAM = availability.slots.find((slot) => slot.time === "11:00")

  assert.deepEqual(
    {
      booked: tenAM?.booked,
      available: tenAM?.available,
      isAvailable: tenAM?.isAvailable,
    },
    {
      booked: 1,
      available: 1,
      isAvailable: true,
    }
  )

  assert.deepEqual(
    {
      booked: tenThirty?.booked,
      available: tenThirty?.available,
      isAvailable: tenThirty?.isAvailable,
    },
    {
      booked: 2,
      available: 0,
      isAvailable: false,
    }
  )

  assert.deepEqual(
    {
      booked: elevenAM?.booked,
      available: elevenAM?.available,
      isAvailable: elevenAM?.isAvailable,
    },
    {
      booked: 0,
      available: 2,
      isAvailable: true,
    }
  )

  const staffConflict = findStaffScheduleConflict(
    [
      {
        id: "apt_1",
        customer: {
          name: "Ada Kan",
        },
        scheduledDate: "2099-06-06",
        scheduledTime: "13:00",
        durationMinutes: 60,
      },
    ],
    {
      scheduledDate: "2099-06-06",
      scheduledTime: "13:30",
      durationMinutes: 30,
    }
  )

  assert.equal(staffConflict?.id, "apt_1")
  assert.equal(staffConflict?.customer.name, "Ada Kan")

  const noConflict = findStaffScheduleConflict(
    [
      {
        id: "apt_2",
        customer: {
          name: "Elif Demir",
        },
        scheduledDate: "2099-06-06",
        scheduledTime: "15:00",
        durationMinutes: 30,
      },
    ],
    {
      scheduledDate: "2099-06-06",
      scheduledTime: "15:30",
      durationMinutes: 30,
    }
  )

  assert.equal(noConflict, null)
}

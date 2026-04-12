import { NextResponse } from "next/server"
import { AppointmentConflictError, createAppointmentFromWeb, listAppointments } from "@/lib/bookings-repository"
import { validateBookingForm } from "@/lib/booking"

export async function GET() {
  const bookings = await listAppointments()

  return NextResponse.json({
    success: true,
    data: bookings,
  })
}

export async function POST(request: Request) {
  const payload = await request.json()
  const validation = validateBookingForm(payload)

  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Form verisi gecersiz.",
        errors: validation.errors,
      },
      { status: 400 }
    )
  }

  try {
    const booking = await createAppointmentFromWeb(validation.data)

    return NextResponse.json(
      {
        success: true,
        data: {
          id: booking.id,
          service: booking.service.title,
          customer: booking.customer.name,
          date: booking.scheduledDate,
          time: booking.scheduledTime,
          status: booking.status,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof AppointmentConflictError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: "Randevu kaydi sirasinda beklenmeyen bir hata olustu.",
      },
      { status: 500 }
    )
  }
}

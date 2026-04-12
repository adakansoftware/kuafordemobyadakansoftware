import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { bookingSchema, type BookingFormValues } from "@/lib/booking"
import { getServiceBySlug } from "@/lib/site-content"

export type BookingStatus = "new" | "confirmed" | "completed"

export type BookingRecord = BookingFormValues & {
  id: string
  createdAt: string
  updatedAt: string
  status: BookingStatus
  serviceTitle: string
}

const dataDirectory = path.join(process.cwd(), "data")
const bookingsFilePath = path.join(dataDirectory, "bookings.json")

async function ensureBookingsFile() {
  await mkdir(dataDirectory, { recursive: true })

  try {
    await readFile(bookingsFilePath, "utf8")
  } catch {
    await writeFile(bookingsFilePath, "[]\n", "utf8")
  }
}

async function readBookings(): Promise<BookingRecord[]> {
  await ensureBookingsFile()
  const fileContents = await readFile(bookingsFilePath, "utf8")
  const parsed = JSON.parse(fileContents) as BookingRecord[]

  return parsed.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

async function writeBookings(bookings: BookingRecord[]) {
  await ensureBookingsFile()
  await writeFile(bookingsFilePath, `${JSON.stringify(bookings, null, 2)}\n`, "utf8")
}

export async function listBookings() {
  return readBookings()
}

export async function createBooking(input: BookingFormValues) {
  const parsed = bookingSchema.parse(input)
  const service = getServiceBySlug(parsed.service)
  const now = new Date().toISOString()

  const record: BookingRecord = {
    ...parsed,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: "new",
    serviceTitle: service?.title ?? parsed.service,
  }

  const bookings = await readBookings()
  bookings.unshift(record)
  await writeBookings(bookings)

  return record
}

export async function getBookingMetrics() {
  const bookings = await readBookings()

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
  }).format(new Date())

  const todayCount = bookings.filter((booking) => booking.date === today).length
  const newCount = bookings.filter((booking) => booking.status === "new").length

  return {
    totalBookings: bookings.length,
    todayBookings: todayCount,
    newBookings: newCount,
    upcomingBookings: bookings.filter((booking) => booking.date >= today).length,
  }
}

export function getBookingsFilePath() {
  return bookingsFilePath
}

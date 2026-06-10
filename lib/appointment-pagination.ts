export function normalizeAppointmentPagination(input?: {
  page?: number
  pageSize?: number
}) {
  const page = Number.isFinite(input?.page) ? Math.floor(input?.page ?? 1) : 1
  const pageSize = Number.isFinite(input?.pageSize) ? Math.floor(input?.pageSize ?? 25) : 25

  return {
    page: Math.max(page, 1),
    pageSize: Math.min(Math.max(pageSize, 1), 50),
  }
}

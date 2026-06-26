import { exportReportCsv } from "@/lib/salon-ops-repository"
import { requireAdminRoles } from "@/lib/security"
import { AdminUserRole } from "@prisma/client"
import { getTodayInIstanbulDate, resolveSafeReportDateRange } from "@/lib/reporting"

export async function GET(request: Request) {
  await requireAdminRoles([AdminUserRole.OWNER, AdminUserRole.MANAGER])
  const url = new URL(request.url)
  const today = getTodayInIstanbulDate()
  const range = resolveSafeReportDateRange({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
    fallbackDate: today,
  })
  const csv = await exportReportCsv(range)

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="report-${range.from}-${range.to}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}

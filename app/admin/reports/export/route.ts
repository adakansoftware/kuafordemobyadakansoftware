import { exportReportCsv } from "@/lib/salon-ops-repository"
import { requireAdminRoles } from "@/lib/security"
import { AdminUserRole } from "@prisma/client"

export async function GET(request: Request) {
  await requireAdminRoles([AdminUserRole.OWNER, AdminUserRole.MANAGER])
  const url = new URL(request.url)
  const from = url.searchParams.get("from") ?? new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date())
  const to = url.searchParams.get("to") ?? from
  const csv = await exportReportCsv({ from, to })

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="report-${from}-${to}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}

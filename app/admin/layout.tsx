import Link from "next/link"
import { AdminUserRole } from "@prisma/client"
import { adminLogoutAction } from "@/app/admin/login/actions"
import { requireAdminAccess } from "@/lib/security"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const access = await requireAdminAccess()

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", roles: [AdminUserRole.OWNER, AdminUserRole.MANAGER, AdminUserRole.STAFF] },
    { href: "/admin/appointments", label: "Appointments", roles: [AdminUserRole.OWNER, AdminUserRole.MANAGER, AdminUserRole.STAFF] },
    { href: "/admin/customers", label: "Customers", roles: [AdminUserRole.OWNER, AdminUserRole.MANAGER] },
    { href: "/admin/staff", label: "Staff", roles: [AdminUserRole.OWNER, AdminUserRole.MANAGER] },
    { href: "/admin/services", label: "Services", roles: [AdminUserRole.OWNER, AdminUserRole.MANAGER] },
    { href: "/admin/packages", label: "Packages", roles: [AdminUserRole.OWNER, AdminUserRole.MANAGER] },
    { href: "/admin/payments", label: "Payments", roles: [AdminUserRole.OWNER, AdminUserRole.MANAGER] },
    { href: "/admin/reports", label: "Reports", roles: [AdminUserRole.OWNER, AdminUserRole.MANAGER] },
    { href: "/admin/settings", label: "Settings", roles: [AdminUserRole.OWNER] },
    { href: "/admin/inventory", label: "Inventory", roles: [AdminUserRole.OWNER, AdminUserRole.MANAGER] },
  ].filter((item) => item.roles.includes(access.role))

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{access.tenantSlug}</p>
            <h1 className="font-serif text-2xl font-bold text-foreground">Salon Isletme Paneli</h1>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div>{access.actorIdentifier}</div>
            <div>{access.role}</div>
            <form action={adminLogoutAction} className="mt-2">
              <button
                type="submit"
                className="rounded-full border border-input bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-accent"
              >
                Oturumu Kapat
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl flex-wrap gap-3 px-6 pb-5 lg:px-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-input bg-background px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:border-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}

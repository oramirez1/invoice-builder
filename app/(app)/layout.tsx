import Link from "next/link";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { requireApprovedUser } from "@/lib/session";
import { logout } from "@/lib/actions/auth";
import { db } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireApprovedUser();
  const pendingCount =
    user.role === "ADMIN" ? await db.user.count({ where: { status: "PENDING" } }) : 0;
  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/invoices", label: "Invoices" },
    { href: "/settings", label: "Settings" },
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Users", badge: pendingCount }] : []),
  ];
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6">
          <Link href="/dashboard"><Logo compact /></Link>
          <NavLinks links={links} />
          <div className="ml-auto flex items-center gap-3">
            <Link href="/invoices/new" className="btn-primary hidden sm:inline-flex">+ New invoice</Link>
            <span className="hidden text-sm text-slate-500 md:inline">{user.name}</span>
            <form action={logout}><button className="btn-secondary btn-sm">Sign out</button></form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

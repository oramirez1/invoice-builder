"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: { href: string; label: string; badge?: number }[] }) {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {links.map((l) => {
        const active = path === l.href || path.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
              active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {l.label}
            {!!l.badge && (
              <span className="rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white">{l.badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

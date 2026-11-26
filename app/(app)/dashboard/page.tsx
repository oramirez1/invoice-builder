import Link from "next/link";
import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/session";
import { getYearStats, getYearsWithInvoices } from "@/lib/stats";
import { formatDate, formatMoney } from "@/lib/calc";
import { StatusBadge, displayStatus } from "@/components/StatusBadge";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const user = await requireApprovedUser();
  const currentYear = new Date().getUTCFullYear();
  const year = Number((await searchParams).year) || currentYear;
  const [stats, years, recent, drafts] = await Promise.all([
    getYearStats(user.id, year),
    getYearsWithInvoices(user.id),
    db.invoice.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    db.invoice.count({ where: { userId: user.id, status: "DRAFT" } }),
  ]);
  const yearOptions = [...new Set([currentYear, ...years])].sort((a, b) => b - a);
  const main = stats.find((s) => s.currency === user.defaultCurrency) ??
    stats[0] ?? { currency: user.defaultCurrency, invoiced: 0, paid: 0, outstanding: 0, count: 0, monthly: Array(12).fill(0) };
  const others = stats.filter((s) => s !== main);
  const maxMonth = Math.max(...main.monthly, 1);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">Totals for {year}. Drafts and cancelled invoices are not counted.</p>
        </div>
        <div className="flex gap-1">
          {yearOptions.map((y) => (
            <Link
              key={y}
              href={`/dashboard?year=${y}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${y === year ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
            >
              {y}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={`Total invoiced in ${year}`} value={formatMoney(main.invoiced, main.currency)} strong />
        <Stat label="Paid" value={formatMoney(main.paid, main.currency)} tone="text-emerald-600" />
        <Stat label="Outstanding" value={formatMoney(main.outstanding, main.currency)} tone="text-amber-600" />
        <Stat label="Invoices issued" value={String(main.count)} hint={drafts ? `${drafts} draft${drafts > 1 ? "s" : ""} not counted` : undefined} />
      </div>
      {others.length > 0 && (
        <div className="card p-4 text-sm text-slate-600">
          Other currencies in {year}:{" "}
          {others.map((o) => `${formatMoney(o.invoiced, o.currency)} (${o.count})`).join(" · ")}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-3">
          <h2 className="mb-4 font-semibold">Invoiced per month ({main.currency})</h2>
          <div className="flex h-48 items-end gap-2">
            {main.monthly.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-40 w-full items-end">
                  <div
                    title={formatMoney(v, main.currency)}
                    className="w-full rounded-t-md bg-brand-500/80 hover:bg-brand-600"
                    style={{ height: `${Math.round((v / maxMonth) * 160)}px`, minHeight: v ? 4 : 0 }}
                  />
                </div>
                <span className="text-[10px] text-slate-500">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent invoices</h2>
            <Link href="/invoices" className="text-sm font-medium text-brand-600">View all</Link>
          </div>
          {recent.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No invoices yet.
              <div className="mt-3"><Link href="/invoices/new" className="btn-primary">Create your first invoice</Link></div>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((inv) => (
                <li key={inv.id}>
                  <Link href={`/invoices/${inv.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{inv.toName}</div>
                      <div className="text-xs text-slate-500">{inv.number} · {formatDate(inv.issueDate)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatMoney(Number(inv.total), inv.currency)}</div>
                      <StatusBadge status={displayStatus(inv)} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, tone, strong, hint }: { label: string; value: string; tone?: string; strong?: boolean; hint?: string }) {
  return (
    <div className={`card p-5 ${strong ? "bg-gradient-to-br from-brand-600 to-brand-700 text-white" : ""}`}>
      <div className={`text-xs font-medium ${strong ? "text-brand-100" : "text-slate-500"}`}>{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${tone ?? ""}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

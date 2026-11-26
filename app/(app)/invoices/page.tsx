import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/session";
import { getYearsWithInvoices } from "@/lib/stats";
import { formatDate, formatMoney } from "@/lib/calc";
import { getTemplate } from "@/lib/templates";
import { StatusBadge, displayStatus } from "@/components/StatusBadge";

type SP = { q?: string; status?: string; year?: string };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireApprovedUser();
  const sp = await searchParams;
  const where: Prisma.InvoiceWhereInput = { userId: user.id };
  if (sp.q) {
    where.OR = [
      { number: { contains: sp.q, mode: "insensitive" } },
      { toName: { contains: sp.q, mode: "insensitive" } },
    ];
  }
  if (sp.status && ["DRAFT", "SENT", "PAID", "CANCELLED"].includes(sp.status)) {
    where.status = sp.status as Prisma.InvoiceWhereInput["status"];
  }
  const year = Number(sp.year);
  if (year) where.issueDate = { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };

  const [invoices, years] = await Promise.all([
    db.invoice.findMany({ where, orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }], take: 500 }),
    getYearsWithInvoices(user.id),
  ]);
  const shownTotal = invoices
    .filter((i) => i.status !== "DRAFT" && i.status !== "CANCELLED" && i.currency === user.defaultCurrency)
    .reduce((s, i) => s + Number(i.total), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Invoice history</h1>
          <p className="text-sm text-slate-500">
            {invoices.length} invoice{invoices.length === 1 ? "" : "s"} · {formatMoney(shownTotal, user.defaultCurrency)} issued
          </p>
        </div>
        <Link href="/invoices/new" className="btn-primary">+ New invoice</Link>
      </div>

      <form className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-48 flex-1">
          <label className="label" htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={sp.q} className="input" placeholder="Invoice # or client" />
        </div>
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={sp.status ?? ""} className="input">
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="year">Year</label>
          <select id="year" name="year" defaultValue={sp.year ?? ""} className="input">
            <option value="">All years</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button className="btn-secondary">Filter</button>
        {(sp.q || sp.status || sp.year) && <Link href="/invoices" className="btn btn-sm text-slate-500">Clear</Link>}
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/invoices/${inv.id}`} className="font-medium text-brand-700 hover:underline">{inv.number}</Link>
                  <div className="text-xs text-slate-400">{getTemplate(inv.templateId).name}</div>
                </td>
                <td className="px-4 py-3">{inv.toName}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(inv.issueDate)}</td>
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(inv.dueDate)}</td>
                <td className="px-4 py-3"><StatusBadge status={displayStatus(inv)} /></td>
                <td className="px-4 py-3 text-right font-medium whitespace-nowrap">{formatMoney(Number(inv.total), inv.currency)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1.5">
                    <Link href={`/invoices/${inv.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
                    <Link href={`/invoices/new?clone=${inv.id}`} className="btn-secondary btn-sm">Clone</Link>
                    <a href={`/api/invoices/${inv.id}/pdf?download=1`} className="btn-secondary btn-sm">PDF</a>
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No invoices match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

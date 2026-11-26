import { db } from "./db";

export type YearStats = {
  currency: string;
  invoiced: number;
  paid: number;
  outstanding: number;
  count: number;
  monthly: number[];
};

/** Totals for a calendar year, grouped by currency. Drafts and cancelled invoices are not counted. */
export async function getYearStats(userId: string, year: number) {
  const invoices = await db.invoice.findMany({
    where: {
      userId,
      status: { in: ["SENT", "PAID"] },
      issueDate: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) },
    },
    select: { currency: true, total: true, amountPaid: true, balanceDue: true, issueDate: true },
  });
  const byCurrency = new Map<string, YearStats>();
  for (const inv of invoices) {
    const s =
      byCurrency.get(inv.currency) ??
      { currency: inv.currency, invoiced: 0, paid: 0, outstanding: 0, count: 0, monthly: Array(12).fill(0) };
    s.invoiced += Number(inv.total);
    s.paid += Number(inv.amountPaid);
    s.outstanding += Math.max(Number(inv.balanceDue), 0);
    s.count += 1;
    s.monthly[inv.issueDate.getUTCMonth()] += Number(inv.total);
    byCurrency.set(inv.currency, s);
  }
  return [...byCurrency.values()].sort((a, b) => b.invoiced - a.invoiced);
}

export async function getYearsWithInvoices(userId: string) {
  const rows = await db.$queryRaw<{ year: number }[]>`
    SELECT DISTINCT EXTRACT(YEAR FROM "issueDate")::int AS year
    FROM "Invoice" WHERE "userId" = ${userId} ORDER BY year DESC`;
  return rows.map((r) => r.year);
}

export type CalcItem = { quantity: number; unitPrice: number; taxable: boolean };
export type CalcInput = {
  items: CalcItem[];
  taxRate: number;
  discountType: "percent" | "amount";
  discountValue: number;
  shipping: number;
  amountPaid: number;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function lineAmount(quantity: number, unitPrice: number) {
  return round2((Number(quantity) || 0) * (Number(unitPrice) || 0));
}

/** Shared by the live preview and the server, so both always agree. */
export function calcTotals(input: CalcInput) {
  const lines = input.items.map((i) => ({ ...i, amount: lineAmount(i.quantity, i.unitPrice) }));
  const subtotal = round2(lines.reduce((s, l) => s + l.amount, 0));
  const rawDiscount =
    input.discountType === "percent"
      ? (subtotal * (Number(input.discountValue) || 0)) / 100
      : Number(input.discountValue) || 0;
  const discountTotal = round2(Math.min(Math.max(rawDiscount, 0), subtotal));
  const taxableBase = lines.filter((l) => l.taxable).reduce((s, l) => s + l.amount, 0);
  // Spread the discount proportionally over taxable lines
  const discountedTaxable = subtotal > 0 ? taxableBase * (1 - discountTotal / subtotal) : 0;
  const taxTotal = round2((discountedTaxable * (Number(input.taxRate) || 0)) / 100);
  const shipping = round2(Number(input.shipping) || 0);
  const total = round2(subtotal - discountTotal + taxTotal + shipping);
  const balanceDue = round2(total - (Number(input.amountPaid) || 0));
  return { lines, subtotal, discountTotal, taxTotal, shipping, total, balanceDue };
}

export function formatMoney(value: number | string, currency = "CAD") {
  const n = typeof value === "string" ? Number(value) : value;
  try {
    return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(n || 0);
  } catch {
    return `${currency} ${(n || 0).toFixed(2)}`;
  }
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

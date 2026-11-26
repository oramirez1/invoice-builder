import { z } from "zod";
import type { Invoice, InvoiceItem, User } from "@prisma/client";
import { getTemplate } from "./templates";

const num = z.coerce.number().finite();
const optStr = z.string().max(2000).optional().default("");

export const invoiceSchema = z.object({
  templateId: z.string().max(50),
  number: z.string().trim().min(1, "Invoice number is required").max(50),
  title: z.string().trim().min(1).max(80),
  status: z.enum(["DRAFT", "SENT", "PAID", "CANCELLED"]),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Issue date is required"),
  dueDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/).optional().default(""),
  poNumber: optStr,
  currency: z.string().length(3),
  fromName: z.string().trim().min(1, "Your business name is required").max(200),
  fromAddress: optStr,
  fromEmail: optStr,
  fromPhone: optStr,
  fromTaxId: optStr,
  logoDataUrl: z.string().max(1_500_000).optional().default(""),
  toName: z.string().trim().min(1, "Client name is required").max(200),
  toAddress: optStr,
  toEmail: optStr,
  toPhone: optStr,
  extraFields: z.record(z.string(), z.string().max(500)).default({}),
  columnLabels: z.object({
    description: z.string().max(40),
    quantity: z.string().max(40),
    unitPrice: z.string().max(40),
    amount: z.string().max(40),
  }),
  taxLabel: z.string().max(40).default("Tax"),
  taxRate: num.min(0).max(100),
  discountType: z.enum(["percent", "amount"]),
  discountValue: num.min(0),
  shipping: num.min(0),
  amountPaid: num.min(0),
  notes: optStr,
  terms: optStr,
  paymentDetails: optStr,
  items: z
    .array(
      z.object({
        description: z.string().trim().max(300),
        details: optStr,
        quantity: num,
        unitPrice: num,
        taxable: z.boolean().default(true),
      }),
    )
    .min(1, "Add at least one line item")
    .max(200),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

const ymd = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");
const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

export function formatInvoiceNumber(prefix: string, n: number) {
  return `${prefix}${String(n).padStart(4, "0")}`;
}

/** A fresh invoice prefilled from the business profile and a template. */
export function newInvoiceData(user: User, templateId: string): InvoiceFormData {
  const t = getTemplate(templateId);
  return {
    templateId: t.id,
    number: formatInvoiceNumber(user.invoicePrefix, user.nextInvoiceNo),
    title: t.title,
    status: "DRAFT",
    issueDate: today(),
    dueDate: plusDays(30),
    poNumber: "",
    currency: user.defaultCurrency,
    fromName: user.companyName || user.name,
    fromAddress: user.companyAddress ?? "",
    fromEmail: user.companyEmail || user.email,
    fromPhone: user.companyPhone ?? "",
    fromTaxId: user.taxId ?? "",
    logoDataUrl: user.logoDataUrl ?? "",
    toName: "",
    toAddress: "",
    toEmail: "",
    toPhone: "",
    extraFields: Object.fromEntries(t.extraFields.map((f) => [f.key, ""])),
    columnLabels: t.columnLabels,
    taxLabel: "HST",
    taxRate: Number(user.defaultTaxRate),
    discountType: "percent",
    discountValue: 0,
    shipping: 0,
    amountPaid: 0,
    notes: t.notes ?? "",
    terms: user.defaultTerms || t.terms || "",
    paymentDetails: user.paymentDetails ?? "",
    items: t.sampleItems.map((i) => ({
      description: i.description,
      details: i.details ?? "",
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      taxable: true,
    })),
  };
}

export function invoiceToFormData(inv: Invoice & { items: InvoiceItem[] }): InvoiceFormData {
  return {
    templateId: inv.templateId,
    number: inv.number,
    title: inv.title,
    status: inv.status,
    issueDate: ymd(inv.issueDate),
    dueDate: ymd(inv.dueDate),
    poNumber: inv.poNumber ?? "",
    currency: inv.currency,
    fromName: inv.fromName,
    fromAddress: inv.fromAddress ?? "",
    fromEmail: inv.fromEmail ?? "",
    fromPhone: inv.fromPhone ?? "",
    fromTaxId: inv.fromTaxId ?? "",
    logoDataUrl: inv.logoDataUrl ?? "",
    toName: inv.toName,
    toAddress: inv.toAddress ?? "",
    toEmail: inv.toEmail ?? "",
    toPhone: inv.toPhone ?? "",
    extraFields: (inv.extraFields ?? {}) as Record<string, string>,
    columnLabels: { ...getTemplate(inv.templateId).columnLabels, ...((inv.columnLabels ?? {}) as object) },
    taxLabel: inv.taxLabel,
    taxRate: Number(inv.taxRate),
    discountType: inv.discountType === "amount" ? "amount" : "percent",
    discountValue: Number(inv.discountValue),
    shipping: Number(inv.shipping),
    amountPaid: Number(inv.amountPaid),
    notes: inv.notes ?? "",
    terms: inv.terms ?? "",
    paymentDetails: inv.paymentDetails ?? "",
    items: [...inv.items]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        description: i.description,
        details: i.details ?? "",
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        taxable: i.taxable,
      })),
  };
}

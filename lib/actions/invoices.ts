"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "../db";
import { requireApprovedUser } from "../session";
import { calcTotals } from "../calc";
import { invoiceSchema, type InvoiceFormData } from "../invoice-data";

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

function toDb(d: InvoiceFormData) {
  const t = calcTotals(d);
  return {
    invoice: {
      templateId: d.templateId,
      number: d.number,
      title: d.title,
      status: d.status,
      issueDate: new Date(d.issueDate + "T00:00:00Z"),
      dueDate: d.dueDate ? new Date(d.dueDate + "T00:00:00Z") : null,
      poNumber: d.poNumber || null,
      currency: d.currency,
      fromName: d.fromName,
      fromAddress: d.fromAddress || null,
      fromEmail: d.fromEmail || null,
      fromPhone: d.fromPhone || null,
      fromTaxId: d.fromTaxId || null,
      logoDataUrl: d.logoDataUrl || null,
      toName: d.toName,
      toAddress: d.toAddress || null,
      toEmail: d.toEmail || null,
      toPhone: d.toPhone || null,
      extraFields: d.extraFields,
      columnLabels: d.columnLabels,
      taxLabel: d.taxLabel || "Tax",
      taxRate: d.taxRate,
      discountType: d.discountType,
      discountValue: d.discountValue,
      shipping: d.shipping,
      amountPaid: d.amountPaid,
      subtotal: t.subtotal,
      discountTotal: t.discountTotal,
      taxTotal: t.taxTotal,
      total: t.total,
      balanceDue: t.balanceDue,
      notes: d.notes || null,
      terms: d.terms || null,
      paymentDetails: d.paymentDetails || null,
    },
    items: t.lines.map((l, i) => ({
      position: i,
      description: d.items[i].description,
      details: d.items[i].details || null,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxable: l.taxable,
      amount: l.amount,
    })),
  };
}

/** Returns the next free number, e.g. INV-0007, and bumps the counter. */
function bumpCounter(prefix: string, number: string, current: number) {
  if (!number.startsWith(prefix)) return current;
  const n = Number(number.slice(prefix.length));
  return Number.isInteger(n) && n >= current ? n + 1 : current;
}

export async function saveInvoice(id: string | null, input: unknown): Promise<SaveResult> {
  const user = await requireApprovedUser();
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { invoice, items } = toDb(parsed.data);

  try {
    if (id) {
      const existing = await db.invoice.findFirst({ where: { id, userId: user.id } });
      if (!existing) return { ok: false, error: "Invoice not found." };
      await db.$transaction([
        db.invoiceItem.deleteMany({ where: { invoiceId: id } }),
        db.invoice.update({ where: { id }, data: { ...invoice, items: { create: items } } }),
      ]);
      revalidatePath("/", "layout");
      return { ok: true, id };
    }
    const created = await db.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: { ...invoice, userId: user.id, items: { create: items } },
      });
      await tx.user.update({
        where: { id: user.id },
        data: { nextInvoiceNo: bumpCounter(user.invoicePrefix, invoice.number, user.nextInvoiceNo) },
      });
      // Remember the client for next time
      await tx.client.upsert({
        where: { userId_name: { userId: user.id, name: invoice.toName } },
        update: { email: invoice.toEmail, address: invoice.toAddress, phone: invoice.toPhone },
        create: {
          userId: user.id,
          name: invoice.toName,
          email: invoice.toEmail,
          address: invoice.toAddress,
          phone: invoice.toPhone,
        },
      });
      return inv;
    });
    revalidatePath("/", "layout");
    return { ok: true, id: created.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: `Invoice number ${invoice.number} is already used. Pick another number.` };
    }
    throw e;
  }
}

export async function setInvoiceStatus(formData: FormData) {
  const user = await requireApprovedUser();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  if (!["DRAFT", "SENT", "PAID", "CANCELLED"].includes(status)) return;
  const inv = await db.invoice.findFirst({ where: { id, userId: user.id } });
  if (!inv) return;
  const data: Prisma.InvoiceUpdateInput = { status };
  if (status === "PAID") {
    data.amountPaid = inv.total;
    data.balanceDue = 0;
  }
  await db.invoice.update({ where: { id }, data });
  revalidatePath("/", "layout");
}

export async function deleteInvoice(formData: FormData) {
  const user = await requireApprovedUser();
  const id = String(formData.get("id"));
  await db.invoice.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/", "layout");
  redirect("/invoices");
}

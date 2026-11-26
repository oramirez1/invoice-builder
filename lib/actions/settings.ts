"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "../db";
import { requireApprovedUser } from "../session";

export type SettingsState = { error?: string; ok?: boolean } | undefined;

const schema = z.object({
  companyName: z.string().trim().max(200),
  companyAddress: z.string().max(1000),
  companyEmail: z.string().trim().max(200),
  companyPhone: z.string().trim().max(60),
  companyWebsite: z.string().trim().max(200),
  taxId: z.string().trim().max(60),
  defaultCurrency: z.string().length(3),
  defaultTaxRate: z.coerce.number().min(0).max(100),
  defaultTerms: z.string().max(2000),
  paymentDetails: z.string().max(2000),
  invoicePrefix: z.string().max(20),
  nextInvoiceNo: z.coerce.number().int().min(1).max(99999999),
  logoDataUrl: z.string().max(1_500_000),
});

export async function saveSettings(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireApprovedUser();
  const raw = Object.fromEntries(
    Object.keys(schema.shape).map((k) => [k, String(formData.get(k) ?? "")]),
  );
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].path + ": " + parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.logoDataUrl && !/^data:image\/(png|jpe?g);base64,/.test(d.logoDataUrl)) {
    return { error: "Logo must be a PNG or JPG image." };
  }
  await db.user.update({
    where: { id: user.id },
    data: { ...d, logoDataUrl: d.logoDataUrl || null },
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

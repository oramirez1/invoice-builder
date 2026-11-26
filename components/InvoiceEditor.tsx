"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { InvoicePreview } from "./InvoicePreview";
import { saveInvoice } from "@/lib/actions/invoices";
import { calcTotals, formatMoney } from "@/lib/calc";
import { CURRENCIES, TEMPLATES, getTemplate } from "@/lib/templates";
import type { InvoiceFormData } from "@/lib/invoice-data";

type Client = { name: string; email: string | null; address: string | null; phone: string | null };
type Item = InvoiceFormData["items"][number];

const sameItems = (a: Item[], tplId: string) => {
  const s = getTemplate(tplId).sampleItems;
  return a.length === s.length && a.every((i, k) => i.description === s[k].description && i.unitPrice === s[k].unitPrice && i.quantity === s[k].quantity);
};

export function InvoiceEditor({
  initial,
  invoiceId,
  clients,
  heading,
}: {
  initial: InvoiceFormData;
  invoiceId: string | null;
  clients: Client[];
  heading: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<InvoiceFormData>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const template = getTemplate(data.templateId);
  const totals = useMemo(() => calcTotals(data), [data]);

  const set = <K extends keyof InvoiceFormData>(key: K, value: InvoiceFormData[K]) =>
    setData((d) => ({ ...d, [key]: value }));
  const setItem = (i: number, patch: Partial<Item>) =>
    setData((d) => ({ ...d, items: d.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) }));

  function chooseTemplate(id: string) {
    const next = getTemplate(id);
    setData((d) => {
      const replaceItems = d.items.every((i) => !i.description) || sameItems(d.items, d.templateId);
      return {
        ...d,
        templateId: next.id,
        title: d.title === getTemplate(d.templateId).title ? next.title : d.title,
        columnLabels: next.columnLabels,
        extraFields: Object.fromEntries(next.extraFields.map((f) => [f.key, d.extraFields[f.key] ?? ""])),
        notes: d.notes || next.notes || "",
        terms: d.terms || next.terms || "",
        items: replaceItems
          ? next.sampleItems.map((s) => ({ description: s.description, details: s.details ?? "", quantity: s.quantity, unitPrice: s.unitPrice, taxable: true }))
          : d.items,
      };
    });
  }

  function chooseClient(name: string) {
    const c = clients.find((c) => c.name === name);
    setData((d) => ({
      ...d,
      toName: name,
      ...(c ? { toEmail: c.email ?? "", toAddress: c.address ?? "", toPhone: c.phone ?? "" } : {}),
    }));
  }

  function save(status?: InvoiceFormData["status"]) {
    setError(null);
    const payload = status ? { ...data, status } : data;
    startSaving(async () => {
      const res = await saveInvoice(invoiceId, payload);
      if (res.ok) router.push(`/invoices/${res.id}`);
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-slate-100 p-0.5 lg:hidden">
            {(["edit", "preview"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-md px-3 py-1 text-sm capitalize ${tab === t ? "bg-white shadow-sm" : "text-slate-500"}`}>{t}</button>
            ))}
          </div>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
          <button type="button" className="btn-secondary" disabled={saving} onClick={() => save()}>
            {saving ? "Saving…" : "Save"}
          </button>
          {data.status === "DRAFT" && (
            <button type="button" className="btn-primary" disabled={saving} onClick={() => save("SENT")}>Save as sent</button>
          )}
        </div>
      </div>
      {error && <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      <section className="card p-4">
        <div className="label">Template</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => chooseTemplate(t.id)}
              className={`rounded-lg border p-3 text-left transition ${data.templateId === t.id ? "border-brand-500 ring-2 ring-brand-100" : "border-slate-200 hover:border-slate-300"}`}
            >
              <span className="mb-2 block h-1.5 w-8 rounded-full" style={{ background: t.accent }} />
              <span className="block text-sm font-medium">{t.name}</span>
              <span className="block text-xs text-slate-500">{t.description}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`space-y-6 ${tab === "preview" ? "hidden lg:block" : ""}`}>
          <section className="card grid gap-4 p-5 sm:grid-cols-2">
            <h2 className="font-semibold sm:col-span-2">Invoice details</h2>
            <Field label="Title"><input className="input" value={data.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <Field label="Invoice number"><input className="input" value={data.number} onChange={(e) => set("number", e.target.value)} /></Field>
            <Field label="Issue date"><input type="date" className="input" value={data.issueDate} onChange={(e) => set("issueDate", e.target.value)} /></Field>
            <Field label="Due date"><input type="date" className="input" value={data.dueDate} onChange={(e) => set("dueDate", e.target.value)} /></Field>
            <Field label="PO number (optional)"><input className="input" value={data.poNumber} onChange={(e) => set("poNumber", e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Currency">
                <select className="input" value={data.currency} onChange={(e) => set("currency", e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className="input" value={data.status} onChange={(e) => set("status", e.target.value as InvoiceFormData["status"])}>
                  <option value="DRAFT">Draft</option><option value="SENT">Sent</option><option value="PAID">Paid</option><option value="CANCELLED">Cancelled</option>
                </select>
              </Field>
            </div>
            {template.extraFields.map((f) => (
              <Field key={f.key} label={f.label}>
                <input className="input" placeholder={f.placeholder} value={data.extraFields[f.key] ?? ""} onChange={(e) => set("extraFields", { ...data.extraFields, [f.key]: e.target.value })} />
              </Field>
            ))}
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <section className="card space-y-3 p-5">
              <h2 className="font-semibold">From</h2>
              <Field label="Business name"><input className="input" value={data.fromName} onChange={(e) => set("fromName", e.target.value)} /></Field>
              <Field label="Address"><textarea rows={3} className="input" value={data.fromAddress} onChange={(e) => set("fromAddress", e.target.value)} /></Field>
              <Field label="Email"><input className="input" value={data.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} /></Field>
              <Field label="Phone"><input className="input" value={data.fromPhone} onChange={(e) => set("fromPhone", e.target.value)} /></Field>
              <Field label="Tax / business number"><input className="input" value={data.fromTaxId} onChange={(e) => set("fromTaxId", e.target.value)} /></Field>
            </section>
            <section className="card space-y-3 p-5">
              <h2 className="font-semibold">Bill to</h2>
              <Field label="Client name">
                <input className="input" list="clients" value={data.toName} onChange={(e) => chooseClient(e.target.value)} placeholder={clients.length ? "Type or pick a saved client" : ""} />
                <datalist id="clients">{clients.map((c) => <option key={c.name} value={c.name} />)}</datalist>
              </Field>
              <Field label="Address"><textarea rows={3} className="input" value={data.toAddress} onChange={(e) => set("toAddress", e.target.value)} /></Field>
              <Field label="Email"><input className="input" value={data.toEmail} onChange={(e) => set("toEmail", e.target.value)} /></Field>
              <Field label="Phone"><input className="input" value={data.toPhone} onChange={(e) => set("toPhone", e.target.value)} /></Field>
            </section>
          </div>

          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Line items</h2>
              <span className="text-xs text-slate-500">Column labels can be renamed</span>
            </div>
            <div className="mb-2 grid grid-cols-[1fr_5rem_6.5rem_6rem_2rem] gap-2">
              {(["description", "quantity", "unitPrice", "amount"] as const).map((k) => (
                <input key={k} aria-label={`${k} column label`} className="input !py-1 text-xs font-semibold uppercase text-slate-500" value={data.columnLabels[k]} onChange={(e) => set("columnLabels", { ...data.columnLabels, [k]: e.target.value })} />
              ))}
            </div>
            <div className="space-y-3">
              {data.items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_5rem_6.5rem_6rem_2rem] items-start gap-2">
                  <div className="space-y-1">
                    <input className="input" placeholder="Description" value={item.description} onChange={(e) => setItem(i, { description: e.target.value })} />
                    <input className="input !py-1 text-xs" placeholder="Details (optional)" value={item.details} onChange={(e) => setItem(i, { details: e.target.value })} />
                    <label className="flex items-center gap-1.5 text-xs text-slate-500">
                      <input type="checkbox" checked={item.taxable} onChange={(e) => setItem(i, { taxable: e.target.checked })} /> Taxable
                    </label>
                  </div>
                  <input type="number" step="any" className="input" value={item.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) })} />
                  <input type="number" step="0.01" className="input" value={item.unitPrice} onChange={(e) => setItem(i, { unitPrice: Number(e.target.value) })} />
                  <div className="py-2 text-right text-sm font-medium">{formatMoney(totals.lines[i].amount, data.currency)}</div>
                  <button type="button" aria-label="Remove item" disabled={data.items.length === 1} className="mt-1.5 rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30" onClick={() => set("items", data.items.filter((_, k) => k !== i))}>✕</button>
                </div>
              ))}
            </div>
            <button type="button" className="btn-secondary btn-sm mt-4" onClick={() => set("items", [...data.items, { description: "", details: "", quantity: 1, unitPrice: 0, taxable: true }])}>+ Add line</button>
          </section>

          <section className="card grid gap-4 p-5 sm:grid-cols-2">
            <h2 className="font-semibold sm:col-span-2">Tax, discount and payments</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tax name"><input className="input" value={data.taxLabel} onChange={(e) => set("taxLabel", e.target.value)} /></Field>
              <Field label="Tax rate %"><input type="number" step="0.001" className="input" value={data.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount">
                <input type="number" step="0.01" className="input" value={data.discountValue} onChange={(e) => set("discountValue", Number(e.target.value))} />
              </Field>
              <Field label="Discount type">
                <select className="input" value={data.discountType} onChange={(e) => set("discountType", e.target.value as "percent" | "amount")}>
                  <option value="percent">Percent %</option><option value="amount">Fixed amount</option>
                </select>
              </Field>
            </div>
            <Field label="Shipping / fees"><input type="number" step="0.01" className="input" value={data.shipping} onChange={(e) => set("shipping", Number(e.target.value))} /></Field>
            <Field label="Amount already paid"><input type="number" step="0.01" className="input" value={data.amountPaid} onChange={(e) => set("amountPaid", Number(e.target.value))} /></Field>
            <div className="rounded-lg bg-slate-50 p-3 text-sm sm:col-span-2">
              <div className="flex justify-between"><span>Total</span><span className="font-semibold">{formatMoney(totals.total, data.currency)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Balance due</span><span>{formatMoney(totals.balanceDue, data.currency)}</span></div>
            </div>
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="font-semibold">Notes and terms</h2>
            <Field label="Notes"><textarea rows={2} className="input" value={data.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
            <Field label="Terms"><textarea rows={2} className="input" value={data.terms} onChange={(e) => set("terms", e.target.value)} /></Field>
            <Field label="Payment details (bank, e-transfer, etc.)"><textarea rows={2} className="input" value={data.paymentDetails} onChange={(e) => set("paymentDetails", e.target.value)} /></Field>
          </section>
        </div>

        <div className={tab === "edit" ? "hidden lg:block" : ""}>
          <div className="sticky top-24">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Live preview</div>
            <div className="card overflow-hidden"><InvoicePreview data={data} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

"use client";

import { useActionState, useState } from "react";
import { saveSettings, type SettingsState } from "@/lib/actions/settings";
import { CURRENCIES } from "@/lib/templates";

type Values = Record<
  | "companyName" | "companyAddress" | "companyEmail" | "companyPhone" | "companyWebsite" | "taxId"
  | "defaultCurrency" | "defaultTaxRate" | "defaultTerms" | "paymentDetails" | "invoicePrefix" | "nextInvoiceNo" | "logoDataUrl",
  string
>;

export function SettingsForm({ initial }: { initial: Values }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, undefined);
  const [logo, setLogo] = useState(initial.logoDataUrl);
  const [logoError, setLogoError] = useState<string | null>(null);

  function onLogo(file: File | undefined) {
    setLogoError(null);
    if (!file) return;
    if (!/image\/(png|jpeg)/.test(file.type)) return setLogoError("Use a PNG or JPG file.");
    if (file.size > 500_000) return setLogoError("Logo must be under 500 KB.");
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  }

  const input = (name: keyof Values, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input" name={name} defaultValue={initial[name]} {...props} />
    </label>
  );
  const area = (name: keyof Values, label: string) => (
    <label className="block">
      <span className="label">{label}</span>
      <textarea className="input" rows={3} name={name} defaultValue={initial[name]} />
    </label>
  );

  return (
    <form action={action} className="space-y-6">
      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Company</h2>
        <div className="flex items-center gap-4 sm:col-span-2">
          <div className="grid h-20 w-40 place-items-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo ? <img src={logo} alt="Logo" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-slate-400">No logo</span>}
          </div>
          <div className="space-y-2">
            <input type="file" accept="image/png,image/jpeg" onChange={(e) => onLogo(e.target.files?.[0])} className="text-sm" />
            {logo && <button type="button" className="btn-secondary btn-sm" onClick={() => setLogo("")}>Remove logo</button>}
            {logoError && <p className="text-xs text-red-600">{logoError}</p>}
          </div>
          <input type="hidden" name="logoDataUrl" value={logo} />
        </div>
        {input("companyName", "Business name")}
        {input("taxId", "Tax / business number (e.g. HST #)")}
        {input("companyEmail", "Email", { type: "email" })}
        {input("companyPhone", "Phone")}
        {input("companyWebsite", "Website")}
        <div className="sm:col-span-2">{area("companyAddress", "Address")}</div>
      </section>

      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Invoice defaults</h2>
        <label className="block">
          <span className="label">Default currency</span>
          <select className="input" name="defaultCurrency" defaultValue={initial.defaultCurrency}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        {input("defaultTaxRate", "Default tax rate %", { type: "number", step: "0.001", min: 0, max: 100 })}
        {input("invoicePrefix", "Invoice number prefix")}
        {input("nextInvoiceNo", "Next invoice number", { type: "number", min: 1 })}
        <div className="sm:col-span-2">{area("defaultTerms", "Default terms")}</div>
        <div className="sm:col-span-2">{area("paymentDetails", "Payment details (bank transfer, e-Transfer email, etc.)")}</div>
      </section>

      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Save settings"}</button>
        {state?.ok && <span className="text-sm text-emerald-600">Saved.</span>}
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}

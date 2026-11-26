import { Fragment } from "react";
import { calcTotals, formatDate, formatMoney } from "@/lib/calc";
import { getTemplate } from "@/lib/templates";
import type { InvoiceFormData } from "@/lib/invoice-data";

/** HTML rendering of an invoice. Mirrors the PDF layout. */
export function InvoicePreview({ data }: { data: InvoiceFormData }) {
  const t = getTemplate(data.templateId);
  const totals = calcTotals(data);
  const money = (n: number) => formatMoney(n, data.currency);
  const extras = t.extraFields.filter((f) => data.extraFields[f.key]);
  const L = data.columnLabels;

  return (
    <div className="bg-white p-8 text-[13px] leading-relaxed text-slate-800" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="h-1.5 -mx-8 -mt-8 mb-8" style={{ background: t.accent }} />
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          {data.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.logoDataUrl} alt="Logo" className="mb-3 max-h-16 max-w-48 object-contain" />
          ) : null}
          <div className="text-base font-semibold">{data.fromName || "Your business"}</div>
          <div className="whitespace-pre-line text-slate-500">{data.fromAddress}</div>
          <div className="text-slate-500">{[data.fromEmail, data.fromPhone].filter(Boolean).join(" · ")}</div>
          {data.fromTaxId && <div className="text-slate-500">Tax ID: {data.fromTaxId}</div>}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold uppercase tracking-wide" style={{ color: t.accent }}>{data.title}</div>
          <div className="mt-1 font-medium"># {data.number}</div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Bill to</div>
          <div className="mt-1 font-semibold">{data.toName || "Client name"}</div>
          <div className="whitespace-pre-line text-slate-500">{data.toAddress}</div>
          <div className="text-slate-500">{[data.toEmail, data.toPhone].filter(Boolean).join(" · ")}</div>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 self-start text-right">
          <dt className="text-slate-400">Issue date</dt><dd>{formatDate(data.issueDate)}</dd>
          {data.dueDate && (<><dt className="text-slate-400">Due date</dt><dd>{formatDate(data.dueDate)}</dd></>)}
          {data.poNumber && (<><dt className="text-slate-400">PO number</dt><dd>{data.poNumber}</dd></>)}
          {extras.map((f) => (
            <Fragment key={f.key}><dt className="text-slate-400">{f.label}</dt><dd>{data.extraFields[f.key]}</dd></Fragment>
          ))}
        </dl>
      </div>

      <table className="mt-8 w-full">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-white" style={{ background: t.accent }}>
            <th className="px-3 py-2 font-semibold">{L.description}</th>
            <th className="w-20 px-3 py-2 text-right font-semibold">{L.quantity}</th>
            <th className="w-28 px-3 py-2 text-right font-semibold">{L.unitPrice}</th>
            <th className="w-28 px-3 py-2 text-right font-semibold">{L.amount}</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i} className="border-b border-slate-100 align-top">
              <td className="px-3 py-2">
                <div className="font-medium">{item.description || <span className="text-slate-300">Item description</span>}</div>
                {item.details && <div className="text-xs text-slate-500">{item.details}</div>}
              </td>
              <td className="px-3 py-2 text-right">{item.quantity}</td>
              <td className="px-3 py-2 text-right">{money(item.unitPrice)}</td>
              <td className="px-3 py-2 text-right">{money(totals.lines[i].amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <dl className="grid w-64 grid-cols-2 gap-y-1">
          <dt className="text-slate-500">Subtotal</dt><dd className="text-right">{money(totals.subtotal)}</dd>
          {totals.discountTotal > 0 && (<>
            <dt className="text-slate-500">Discount{data.discountType === "percent" ? ` (${data.discountValue}%)` : ""}</dt>
            <dd className="text-right">−{money(totals.discountTotal)}</dd>
          </>)}
          {data.taxRate > 0 && (<>
            <dt className="text-slate-500">{data.taxLabel || "Tax"} ({data.taxRate}%)</dt>
            <dd className="text-right">{money(totals.taxTotal)}</dd>
          </>)}
          {totals.shipping > 0 && (<><dt className="text-slate-500">Shipping</dt><dd className="text-right">{money(totals.shipping)}</dd></>)}
          <dt className="border-t border-slate-200 pt-1 font-semibold">Total</dt>
          <dd className="border-t border-slate-200 pt-1 text-right font-semibold">{money(totals.total)}</dd>
          {data.amountPaid > 0 && (<><dt className="text-slate-500">Amount paid</dt><dd className="text-right">−{money(data.amountPaid)}</dd></>)}
          <dt className="mt-1 rounded-l-md px-2 py-1.5 font-semibold text-white" style={{ background: t.accent }}>Balance due</dt>
          <dd className="mt-1 rounded-r-md px-2 py-1.5 text-right font-semibold text-white" style={{ background: t.accent }}>{money(totals.balanceDue)}</dd>
        </dl>
      </div>

      {(data.notes || data.terms || data.paymentDetails) && (
        <div className="mt-8 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          {data.notes && <Block title="Notes" text={data.notes} />}
          {data.terms && <Block title="Terms" text={data.terms} />}
          {data.paymentDetails && <Block title="Payment details" text={data.paymentDetails} />}
        </div>
      )}
    </div>
  );
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</div>
      <div className="mt-1 whitespace-pre-line text-slate-600">{text}</div>
    </div>
  );
}

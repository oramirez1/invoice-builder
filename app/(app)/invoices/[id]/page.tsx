import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/session";
import { invoiceToFormData } from "@/lib/invoice-data";
import { deleteInvoice, setInvoiceStatus } from "@/lib/actions/invoices";
import { InvoicePreview } from "@/components/InvoicePreview";
import { StatusBadge, displayStatus } from "@/components/StatusBadge";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireApprovedUser();
  const { id } = await params;
  const invoice = await db.invoice.findFirst({ where: { id, userId: user.id }, include: { items: true } });
  if (!invoice) notFound();
  const data = invoiceToFormData(invoice);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="text-sm text-slate-500 hover:text-slate-800">← Invoices</Link>
          <h1 className="text-2xl font-semibold">{invoice.number}</h1>
          <StatusBadge status={displayStatus(invoice)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/invoices/${invoice.id}/pdf?download=1`} className="btn-primary">Download PDF</a>
          <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" className="btn-secondary">Open PDF</a>
          <Link href={`/invoices/${invoice.id}/edit`} className="btn-secondary">Edit</Link>
          <Link href={`/invoices/new?clone=${invoice.id}`} className="btn-secondary">Clone</Link>
        </div>
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-3 text-sm">
        <span className="mr-1 text-slate-500">Mark as:</span>
        {(["DRAFT", "SENT", "PAID", "CANCELLED"] as const).filter((s) => s !== invoice.status).map((s) => (
          <form key={s} action={setInvoiceStatus}>
            <input type="hidden" name="id" value={invoice.id} />
            <input type="hidden" name="status" value={s} />
            <button className="btn-secondary btn-sm">{s.charAt(0) + s.slice(1).toLowerCase()}</button>
          </form>
        ))}
        <form action={deleteInvoice} className="ml-auto">
          <input type="hidden" name="id" value={invoice.id} />
          <ConfirmButton message={`Delete invoice ${invoice.number}? This cannot be undone.`} className="btn-danger btn-sm">Delete</ConfirmButton>
        </form>
      </div>

      <div className="card overflow-hidden"><InvoicePreview data={data} /></div>
    </div>
  );
}

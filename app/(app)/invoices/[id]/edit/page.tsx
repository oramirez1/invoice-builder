import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/session";
import { invoiceToFormData } from "@/lib/invoice-data";
import { InvoiceEditor } from "@/components/InvoiceEditor";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireApprovedUser();
  const { id } = await params;
  const invoice = await db.invoice.findFirst({ where: { id, userId: user.id }, include: { items: true } });
  if (!invoice) notFound();
  const clients = await db.client.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    select: { name: true, email: true, address: true, phone: true },
  });
  return (
    <InvoiceEditor initial={invoiceToFormData(invoice)} invoiceId={invoice.id} clients={clients} heading={`Edit ${invoice.number}`} />
  );
}

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireApprovedUser } from "@/lib/session";
import { formatInvoiceNumber, invoiceToFormData, newInvoiceData } from "@/lib/invoice-data";
import { InvoiceEditor } from "@/components/InvoiceEditor";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; clone?: string }>;
}) {
  const user = await requireApprovedUser();
  const sp = await searchParams;
  const clients = await db.client.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
    select: { name: true, email: true, address: true, phone: true },
  });

  let initial = newInvoiceData(user, sp.template ?? "blank");
  let heading = "New invoice";
  if (sp.clone) {
    const source = await db.invoice.findFirst({ where: { id: sp.clone, userId: user.id }, include: { items: true } });
    if (!source) notFound();
    const fresh = newInvoiceData(user, source.templateId);
    // Copy everything, but give the clone a new number, today's dates and an unpaid draft status
    initial = {
      ...invoiceToFormData(source),
      number: formatInvoiceNumber(user.invoicePrefix, user.nextInvoiceNo),
      status: "DRAFT",
      issueDate: fresh.issueDate,
      dueDate: fresh.dueDate,
      amountPaid: 0,
    };
    heading = `Clone of ${source.number}`;
  }
  return <InvoiceEditor initial={initial} invoiceId={null} clients={clients} heading={heading} />;
}

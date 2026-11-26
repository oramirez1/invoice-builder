import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { invoiceToFormData } from "@/lib/invoice-data";
import { InvoicePdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.status !== "APPROVED") return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const invoice = await db.invoice.findFirst({ where: { id, userId: user.id }, include: { items: true } });
  if (!invoice) return new Response("Not found", { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(InvoicePdf, { data: invoiceToFormData(invoice) }) as any);
  const download = new URL(req.url).searchParams.has("download");
  const filename = `${invoice.number.replace(/[^\w.-]+/g, "_")}.pdf`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

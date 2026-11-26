import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { calcTotals, formatDate, formatMoney } from "./calc";
import { getTemplate } from "./templates";
import type { InvoiceFormData } from "./invoice-data";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9.5, color: "#1e293b", paddingBottom: 48 },
  bar: { height: 6 },
  body: { paddingHorizontal: 40, paddingTop: 32 },
  row: { flexDirection: "row" },
  between: { flexDirection: "row", justifyContent: "space-between" },
  muted: { color: "#64748b" },
  faint: { color: "#94a3b8" },
  bold: { fontFamily: "Helvetica-Bold" },
  small: { fontSize: 8, textTransform: "uppercase", letterSpacing: 0.8, color: "#94a3b8", fontFamily: "Helvetica-Bold" },
  th: { paddingVertical: 6, paddingHorizontal: 8, color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 8, textTransform: "uppercase" },
  td: { paddingVertical: 6, paddingHorizontal: 8 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, fontSize: 8, color: "#94a3b8", flexDirection: "row", justifyContent: "space-between" },
});

const COL = { qty: 60, price: 85, amount: 85 };

export function InvoicePdf({ data }: { data: InvoiceFormData }) {
  const t = getTemplate(data.templateId);
  const totals = calcTotals(data);
  const money = (n: number) => formatMoney(n, data.currency).replace(/ /g, " ");
  const L = data.columnLabels;
  const meta: [string, string][] = [
    ["Issue date", formatDate(data.issueDate)],
    ...(data.dueDate ? [["Due date", formatDate(data.dueDate)] as [string, string]] : []),
    ...(data.poNumber ? [["PO number", data.poNumber] as [string, string]] : []),
    ...t.extraFields.filter((f) => data.extraFields[f.key]).map((f) => [f.label, data.extraFields[f.key]] as [string, string]),
  ];

  return (
    <Document title={`${data.title} ${data.number}`} author={data.fromName}>
      <Page size="LETTER" style={s.page}>
        <View style={[s.bar, { backgroundColor: t.accent }]} fixed />
        <View style={s.body}>
          <View style={s.between}>
            <View style={{ maxWidth: 280 }}>
              {data.logoDataUrl ? <Image src={data.logoDataUrl} style={{ maxHeight: 56, maxWidth: 170, marginBottom: 8, objectFit: "contain" }} /> : null}
              <Text style={[s.bold, { fontSize: 12 }]}>{data.fromName}</Text>
              {data.fromAddress ? <Text style={s.muted}>{data.fromAddress}</Text> : null}
              {data.fromEmail || data.fromPhone ? <Text style={s.muted}>{[data.fromEmail, data.fromPhone].filter(Boolean).join("  ·  ")}</Text> : null}
              {data.fromTaxId ? <Text style={s.muted}>Tax ID: {data.fromTaxId}</Text> : null}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[s.bold, { fontSize: 20, color: t.accent, textTransform: "uppercase", letterSpacing: 1 }]}>{data.title}</Text>
              <Text style={[s.bold, { marginTop: 4 }]}># {data.number}</Text>
            </View>
          </View>

          <View style={[s.between, { marginTop: 28 }]}>
            <View style={{ maxWidth: 260 }}>
              <Text style={s.small}>Bill to</Text>
              <Text style={[s.bold, { marginTop: 3, fontSize: 10.5 }]}>{data.toName}</Text>
              {data.toAddress ? <Text style={s.muted}>{data.toAddress}</Text> : null}
              {data.toEmail || data.toPhone ? <Text style={s.muted}>{[data.toEmail, data.toPhone].filter(Boolean).join("  ·  ")}</Text> : null}
            </View>
            <View style={{ minWidth: 200 }}>
              {meta.map(([k, v]) => (
                <View key={k} style={[s.between, { marginBottom: 2 }]}>
                  <Text style={[s.faint, { marginRight: 16 }]}>{k}</Text>
                  <Text style={{ textAlign: "right", maxWidth: 150 }}>{v}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 24 }}>
            <View style={[s.row, { backgroundColor: t.accent }]} fixed>
              <Text style={[s.th, { flex: 1 }]}>{L.description}</Text>
              <Text style={[s.th, { width: COL.qty, textAlign: "right" }]}>{L.quantity}</Text>
              <Text style={[s.th, { width: COL.price, textAlign: "right" }]}>{L.unitPrice}</Text>
              <Text style={[s.th, { width: COL.amount, textAlign: "right" }]}>{L.amount}</Text>
            </View>
            {data.items.map((item, i) => (
              <View key={i} style={[s.row, { borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0" }]} wrap={false}>
                <View style={[s.td, { flex: 1 }]}>
                  <Text style={s.bold}>{item.description}</Text>
                  {item.details ? <Text style={[s.muted, { fontSize: 8.5, marginTop: 1 }]}>{item.details}</Text> : null}
                </View>
                <Text style={[s.td, { width: COL.qty, textAlign: "right" }]}>{String(item.quantity)}</Text>
                <Text style={[s.td, { width: COL.price, textAlign: "right" }]}>{money(item.unitPrice)}</Text>
                <Text style={[s.td, { width: COL.amount, textAlign: "right" }]}>{money(totals.lines[i].amount)}</Text>
              </View>
            ))}
          </View>

          <View style={{ alignItems: "flex-end", marginTop: 12 }} wrap={false}>
            <View style={{ width: 220 }}>
              <TotalRow label="Subtotal" value={money(totals.subtotal)} />
              {totals.discountTotal > 0 ? <TotalRow label={`Discount${data.discountType === "percent" ? ` (${data.discountValue}%)` : ""}`} value={`-${money(totals.discountTotal)}`} /> : null}
              {data.taxRate > 0 ? <TotalRow label={`${data.taxLabel || "Tax"} (${data.taxRate}%)`} value={money(totals.taxTotal)} /> : null}
              {totals.shipping > 0 ? <TotalRow label="Shipping" value={money(totals.shipping)} /> : null}
              <View style={{ borderTopWidth: 0.75, borderTopColor: "#cbd5e1", marginTop: 3, paddingTop: 3 }}>
                <TotalRow label="Total" value={money(totals.total)} bold />
              </View>
              {data.amountPaid > 0 ? <TotalRow label="Amount paid" value={`-${money(data.amountPaid)}`} /> : null}
              <View style={[s.between, { backgroundColor: t.accent, padding: 6, marginTop: 4, borderRadius: 3 }]}>
                <Text style={[s.bold, { color: "#fff" }]}>Balance due</Text>
                <Text style={[s.bold, { color: "#fff" }]}>{money(totals.balanceDue)}</Text>
              </View>
            </View>
          </View>

          {[["Notes", data.notes], ["Terms", data.terms], ["Payment details", data.paymentDetails]]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <View key={k} style={{ marginTop: 16 }} wrap={false}>
                <Text style={s.small}>{k}</Text>
                <Text style={[s.muted, { marginTop: 3 }]}>{v}</Text>
              </View>
            ))}
        </View>
        <View style={s.footer} fixed>
          <Text>{data.fromName} · {data.title} {data.number}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

function TotalRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={[s.between, { paddingVertical: 2 }]}>
      <Text style={bold ? s.bold : s.muted}>{label}</Text>
      <Text style={bold ? s.bold : undefined}>{value}</Text>
    </View>
  );
}

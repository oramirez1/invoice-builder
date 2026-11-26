import { requireApprovedUser } from "@/lib/session";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const user = await requireApprovedUser();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Business settings</h1>
        <p className="text-sm text-slate-500">These details prefill every new invoice.</p>
      </div>
      <SettingsForm
        initial={{
          companyName: user.companyName ?? "",
          companyAddress: user.companyAddress ?? "",
          companyEmail: user.companyEmail ?? "",
          companyPhone: user.companyPhone ?? "",
          companyWebsite: user.companyWebsite ?? "",
          taxId: user.taxId ?? "",
          defaultCurrency: user.defaultCurrency,
          defaultTaxRate: String(user.defaultTaxRate),
          defaultTerms: user.defaultTerms ?? "",
          paymentDetails: user.paymentDetails ?? "",
          invoicePrefix: user.invoicePrefix,
          nextInvoiceNo: String(user.nextInvoiceNo),
          logoDataUrl: user.logoDataUrl ?? "",
        }}
      />
    </div>
  );
}

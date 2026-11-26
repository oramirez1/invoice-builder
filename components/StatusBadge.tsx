const styles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-50 text-blue-700",
  PAID: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
  OVERDUE: "bg-amber-50 text-amber-700",
  PENDING: "bg-amber-50 text-amber-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.DRAFT}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function displayStatus(inv: { status: string; dueDate: Date | null }) {
  if (inv.status === "SENT" && inv.dueDate && inv.dueDate < new Date(new Date().toISOString().slice(0, 10))) {
    return "OVERDUE";
  }
  return inv.status;
}

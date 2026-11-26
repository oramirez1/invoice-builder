import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { setUserRole, setUserStatus } from "@/lib/actions/admin";
import { formatDate } from "@/lib/calc";
import { StatusBadge } from "@/components/StatusBadge";

export default async function AdminPage() {
  const admin = await requireAdmin();
  const users = await db.user.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { _count: { select: { invoices: true } } },
  });
  const pending = users.filter((u) => u.status === "PENDING");
  const others = users.filter((u) => u.status !== "PENDING");

  const Actions = ({ u }: { u: (typeof users)[number] }) =>
    u.id === admin.id ? (
      <span className="text-xs text-slate-400">You</span>
    ) : (
      <div className="flex justify-end gap-1.5">
        {u.status !== "APPROVED" && <StatusForm id={u.id} status="APPROVED" label="Approve" primary />}
        {u.status !== "REJECTED" && <StatusForm id={u.id} status="REJECTED" label={u.status === "APPROVED" ? "Revoke access" : "Reject"} />}
        {u.status === "APPROVED" && (
          <form action={setUserRole}>
            <input type="hidden" name="userId" value={u.id} />
            <input type="hidden" name="role" value={u.role === "ADMIN" ? "USER" : "ADMIN"} />
            <button className="btn-secondary btn-sm">{u.role === "ADMIN" ? "Remove admin" : "Make admin"}</button>
          </form>
        )}
      </div>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-slate-500">Approve new accounts before they can create invoices.</p>
      </div>

      <section className="card">
        <h2 className="border-b border-slate-100 px-5 py-3 font-semibold">
          Waiting for approval <span className="text-slate-400">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">No pending requests.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pending.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-sm text-slate-500">{u.email} · signed up {formatDate(u.createdAt)}</div>
                </div>
                <Actions u={u} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card overflow-x-auto">
        <h2 className="border-b border-slate-100 px-5 py-3 font-semibold">All users</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-5 py-2">Name</th><th className="px-5 py-2">Email</th><th className="px-5 py-2">Role</th><th className="px-5 py-2">Status</th><th className="px-5 py-2">Invoices</th><th className="px-5 py-2" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {others.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3 font-medium">{u.name}</td>
                <td className="px-5 py-3 text-slate-600">{u.email}</td>
                <td className="px-5 py-3">{u.role === "ADMIN" ? "Admin" : "User"}</td>
                <td className="px-5 py-3"><StatusBadge status={u.status} /></td>
                <td className="px-5 py-3">{u._count.invoices}</td>
                <td className="px-5 py-3"><Actions u={u} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function StatusForm({ id, status, label, primary }: { id: string; status: string; label: string; primary?: boolean }) {
  return (
    <form action={setUserStatus}>
      <input type="hidden" name="userId" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={`${primary ? "btn-primary" : "btn-secondary"} btn-sm`}>{label}</button>
    </form>
  );
}

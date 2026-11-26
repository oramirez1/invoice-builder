import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/session";
import { logout } from "@/lib/actions/auth";

export default async function PendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "APPROVED") redirect("/dashboard");
  const rejected = user.status === "REJECTED";
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className={`mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full ${rejected ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
          {rejected ? "✕" : "⏳"}
        </div>
        <h1 className="text-xl font-semibold">{rejected ? "Access not approved" : "Waiting for approval"}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {rejected
            ? "Your account request was not approved. Contact the administrator if you think this is a mistake."
            : `Thanks, ${user.name}. Your account is pending review by an administrator. Check back soon. This page will let you in once you're approved.`}
        </p>
        <form action={logout} className="mt-6">
          <button className="btn-secondary">Sign out</button>
        </form>
      </div>
    </main>
  );
}

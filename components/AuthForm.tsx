"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type FormState } from "@/lib/actions/auth";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    mode === "login" ? login : signup,
    undefined,
  );
  return (
    <form action={action} className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{mode === "login" ? "Sign in" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "login"
            ? "Welcome back. Sign in to manage your invoices."
            : "New accounts are reviewed by an administrator before you can create invoices."}
        </p>
      </div>
      {mode === "signup" && (
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input className="input" id="name" name="name" required autoComplete="name" />
        </div>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
      <p className="text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>No account yet? <Link className="font-medium text-brand-600" href="/signup">Sign up</Link></>
        ) : (
          <>Already have an account? <Link className="font-medium text-brand-600" href="/login">Sign in</Link></>
        )}
      </p>
    </form>
  );
}

"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "../db";
import { createSession, destroySession } from "../session";

export type FormState = { error?: string } | undefined;

const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) {
    return { error: "An account with this email already exists." };
  }

  const isAdmin = !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL.trim().toLowerCase();
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: isAdmin ? "ADMIN" : "USER",
      status: isAdmin ? "APPROVED" : "PENDING",
      approvedAt: isAdmin ? new Date() : null,
    },
  });
  await createSession(user.id);
  redirect(isAdmin ? "/dashboard" : "/pending");
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }
  await createSession(user.id);
  redirect(user.status === "APPROVED" ? "/dashboard" : "/pending");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

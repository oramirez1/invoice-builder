"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";
import { requireAdmin } from "../session";

export async function setUserStatus(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId"));
  const status = String(formData.get("status"));
  if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) return;
  if (userId === admin.id) return; // never lock yourself out
  await db.user.update({
    where: { id: userId },
    data: {
      status: status as "APPROVED" | "REJECTED" | "PENDING",
      approvedAt: status === "APPROVED" ? new Date() : null,
    },
  });
  revalidatePath("/admin");
}

export async function setUserRole(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId"));
  const role = String(formData.get("role")) === "ADMIN" ? "ADMIN" : "USER";
  if (userId === admin.id) return;
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin");
}

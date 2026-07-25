"use server";

import {
  checkAdminPassword,
  createAdminSession,
  destroyAdminSession,
} from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export async function loginAdminAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!password || !checkAdminPassword(password)) {
    redirect("/admin/login?error=1");
  }

  await createAdminSession();
  redirect("/admin/order");
}

export async function logoutAdminAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

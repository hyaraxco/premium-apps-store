"use server";

import { headers } from "next/headers";
import {
  checkAdminPassword,
  createAdminSession,
  destroyAdminSession,
} from "@/lib/admin-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { redirect } from "next/navigation";

export async function loginAdminAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  // Brute-force protection: max 5 attempts per 15 min per client IP.
  // Runs before the password check so failed attempts are counted too.
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const limit = await checkRateLimit(`login_${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    redirect(
      "/admin/login?flash=err&msg=" +
        encodeURIComponent("Terlalu banyak percobaan login. Silakan tunggu 15 menit."),
    );
  }

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

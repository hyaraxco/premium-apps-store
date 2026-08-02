"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin-auth";
import { redirectWithFlash } from "@/lib/admin-flash";
import { isValidQrisStatic } from "@/lib/qris";
import { sanitizeWaNumber } from "@/lib/format";

export async function updateAdminSettingsAction(formData: FormData) {
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    redirectWithFlash("/admin/login", "err", "Sesi admin berakhir.");
  }

  const bcaName = String(formData.get("bca_name") ?? "").trim();
  const bcaNumber = String(formData.get("bca_number") ?? "").trim();
  const seabankName = String(formData.get("seabank_name") ?? "").trim();
  const seabankNumber = String(formData.get("seabank_number") ?? "").trim();
  const qrisString = String(formData.get("qris_string") ?? "").trim();
  const rawAdminWa = String(formData.get("admin_wa") ?? "").trim();
  const adminWa = sanitizeWaNumber(rawAdminWa);
  const maintenanceMode =
    formData.get("maintenance_mode") === "on" ? "true" : "false";

  if (qrisString && !isValidQrisStatic(qrisString)) {
    redirectWithFlash(
      "/admin/pengaturan",
      "err",
      "String QRIS tidak valid (TLV/CRC). Paste payload statis utuh dari stiker merchant.",
    );
  }

  const settingsToUpdate = [
    { key: "bca_name", value: bcaName },
    { key: "bca_number", value: bcaNumber },
    { key: "seabank_name", value: seabankName },
    { key: "seabank_number", value: seabankNumber },
    { key: "qris_string", value: qrisString },
    { key: "admin_wa", value: adminWa },
    { key: "maintenance_mode", value: maintenanceMode },
  ];

  if (!process.env.DATABASE_URL) {
    redirectWithFlash(
      "/admin/pengaturan",
      "err",
      "DATABASE_URL belum diset — pengaturan tidak tersimpan.",
    );
  }

  try {
    for (const item of settingsToUpdate) {
      // Always upsert including empty (except we keep qris optional empty → falls back at runtime)
      await db
        .insert(schema.adminSettings)
        .values({ key: item.key, value: item.value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: schema.adminSettings.key,
          set: { value: item.value, updatedAt: new Date() },
        });
    }
  } catch (e) {
    console.error("Settings save error:", e);
    redirectWithFlash("/admin/pengaturan", "err", "Gagal menyimpan pengaturan.");
  }

  revalidatePath("/admin/pengaturan");
  revalidatePath("/checkout/sukses");
  revalidatePath("/");
  redirectWithFlash(
    "/admin/pengaturan",
    "ok",
    "Pengaturan toko disimpan.",
  );
}

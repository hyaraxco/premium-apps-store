"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function updateAdminSettingsAction(formData: FormData) {
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    throw new Error("Unauthorized: Admin session required.");
  }

  const bcaName = String(formData.get("bca_name") ?? "").trim();
  const bcaNumber = String(formData.get("bca_number") ?? "").trim();
  const seabankName = String(formData.get("seabank_name") ?? "").trim();
  const seabankNumber = String(formData.get("seabank_number") ?? "").trim();
  const qrisString = String(formData.get("qris_string") ?? "").trim();
  const adminWa = String(formData.get("admin_wa") ?? "").trim();
  const maintenanceMode = formData.get("maintenance_mode") === "on" ? "true" : "false";

  const settingsToUpdate = [
    { key: "bca_name", value: bcaName },
    { key: "bca_number", value: bcaNumber },
    { key: "seabank_name", value: seabankName },
    { key: "seabank_number", value: seabankNumber },
    { key: "qris_string", value: qrisString },
    { key: "admin_wa", value: adminWa },
    { key: "maintenance_mode", value: maintenanceMode },
  ];

  if (process.env.DATABASE_URL) {
    for (const item of settingsToUpdate) {
      if (item.value) {
        await db
          .insert(schema.adminSettings)
          .values({ key: item.key, value: item.value, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: schema.adminSettings.key,
            set: { value: item.value, updatedAt: new Date() },
          });
      }
    }
  }

  revalidatePath("/admin/pengaturan");
  revalidatePath("/checkout/sukses");
}

"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin-auth";
import { redirectWithFlash } from "@/lib/admin-flash";

export async function updatePoolStockAction(formData: FormData) {
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    redirectWithFlash("/admin/login", "err", "Sesi admin berakhir.");
  }

  const productId = String(formData.get("productId") ?? "").trim();
  const raw = String(formData.get("stock") ?? "0");
  const newStock = parseInt(raw, 10);

  if (!productId || Number.isNaN(newStock)) {
    redirectWithFlash("/admin/produk", "err", "Stok atau produk tidak valid.");
  }

  if (!process.env.DATABASE_URL) {
    redirectWithFlash("/admin/produk", "err", "DATABASE_URL belum diset.");
  }

  try {
    await db
      .update(schema.inventoryPools)
      .set({ availableStock: Math.max(0, newStock), updatedAt: new Date() })
      .where(eq(schema.inventoryPools.productId, productId));
  } catch (e) {
    console.error("Update pool stock error:", e);
    redirectWithFlash("/admin/produk", "err", "Gagal update stok pool.");
  }

  revalidatePath("/admin/produk");
  revalidatePath("/katalog");
  redirectWithFlash(
    "/admin/produk",
    "ok",
    `Stok pool diperbarui → ${Math.max(0, newStock)}.`,
  );
}

export async function toggleProductActiveAction(formData: FormData) {
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    redirectWithFlash("/admin/login", "err", "Sesi admin berakhir.");
  }

  const productId = String(formData.get("productId") ?? "").trim();
  const currentActive = String(formData.get("currentActive") ?? "") === "true";

  if (!productId) {
    redirectWithFlash("/admin/produk", "err", "Produk tidak valid.");
  }

  if (!process.env.DATABASE_URL) {
    redirectWithFlash("/admin/produk", "err", "DATABASE_URL belum diset.");
  }

  try {
    await db
      .update(schema.products)
      .set({ isActive: !currentActive })
      .where(eq(schema.products.id, productId));
  } catch (e) {
    console.error("Toggle product active error:", e);
    redirectWithFlash("/admin/produk", "err", "Gagal ubah status produk.");
  }

  revalidatePath("/admin/produk");
  revalidatePath("/katalog");
  redirectWithFlash(
    "/admin/produk",
    "ok",
    currentActive ? "Produk dinonaktifkan dari katalog." : "Produk diaktifkan.",
  );
}

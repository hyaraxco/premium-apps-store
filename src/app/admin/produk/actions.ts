"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function updatePoolStockAction(productId: string, newStock: number) {
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    throw new Error("Unauthorized: Admin session required.");
  }

  if (process.env.DATABASE_URL) {
    try {
      await db
        .update(schema.inventoryPools)
        .set({ availableStock: Math.max(0, newStock), updatedAt: new Date() })
        .where(eq(schema.inventoryPools.productId, productId));
    } catch (e) {
      console.error("Update pool stock error:", e);
    }
  }
  revalidatePath("/admin/produk");
  revalidatePath("/katalog");
}

export async function toggleProductActiveAction(productId: string, currentActive: boolean) {
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    throw new Error("Unauthorized: Admin session required.");
  }

  if (process.env.DATABASE_URL) {
    try {
      await db
        .update(schema.products)
        .set({ isActive: !currentActive })
        .where(eq(schema.products.id, productId));
    } catch (e) {
      console.error("Toggle product active error:", e);
    }
  }
  revalidatePath("/admin/produk");
  revalidatePath("/katalog");
}

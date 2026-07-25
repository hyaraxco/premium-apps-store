"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateVariantStockAction(variantId: string, newStock: number) {
  if (process.env.DATABASE_URL) {
    try {
      await db
        .update(schema.productVariants)
        .set({ stock: Math.max(0, newStock) })
        .where(eq(schema.productVariants.id, variantId));
    } catch (e) {
      console.error("Update stock error:", e);
    }
  }
  revalidatePath("/admin/produk");
  revalidatePath("/katalog");
}

export async function toggleProductActiveAction(productId: string, currentActive: boolean) {
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

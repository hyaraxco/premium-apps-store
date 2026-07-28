import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { withTransaction } from "@/db/tx";

/**
 * Cancel unpaid orders past payment_expires_at and release pool stock.
 * Safe to call on-read or from a cron route.
 */
export async function expireUnpaidOrders(limit = 50): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;

  const now = new Date();
  let expired = 0;

  // Process one-by-one to keep each release atomic and simple
  for (let i = 0; i < limit; i++) {
    const did = await withTransaction(async (tx) => {
      const due = await tx
        .select()
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.paymentStatus, "pending"),
            lt(schema.orders.paymentExpiresAt, now),
          ),
        )
        .limit(1);

      if (due.length === 0) return false;
      const order = due[0];

      const items = await tx
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, order.id));

      // Aggregate qty per product for pool release
      const qtyByProduct = new Map<string, number>();
      for (const item of items) {
        qtyByProduct.set(
          item.productId,
          (qtyByProduct.get(item.productId) ?? 0) + item.qty,
        );
      }

      for (const [productId, qty] of qtyByProduct) {
        await tx
          .update(schema.inventoryPools)
          .set({
            availableStock: sql`${schema.inventoryPools.availableStock} + ${qty}`,
            updatedAt: new Date(),
          })
          .where(eq(schema.inventoryPools.productId, productId));
      }

      await tx
        .update(schema.orders)
        .set({
          paymentStatus: "cancelled",
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, order.id));

      return true;
    });

    if (!did) break;
    expired += 1;
  }

  return expired;
}

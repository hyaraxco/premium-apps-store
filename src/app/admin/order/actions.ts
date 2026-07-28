"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sendFulfillmentEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin-auth";
import { withTransaction } from "@/db/tx";

export async function markOrderPaidAction(orderId: string, reference?: string) {
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    throw new Error("Unauthorized: Admin session required.");
  }

  if (process.env.DATABASE_URL) {
    await withTransaction(async (tx) => {
      const orders = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);
      
      if (!orders[0]) throw new Error("Order not found");
      if (orders[0].paymentStatus !== "pending") {
        throw new Error("Order is not pending");
      }

      await tx
        .update(schema.orders)
        .set({
          paymentStatus: "paid",
          status: "paid", // legacy
          paidAt: new Date(),
          verifiedBy: "admin",
          paymentReference: reference || null,
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, orderId));
    }).catch((e) => console.error("Mark paid error:", e));
  }

  revalidatePath(`/admin/order/${orderId}`);
  revalidatePath(`/admin/order`);
}

export async function submitUnitFulfillmentAction(formData: FormData) {
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    throw new Error("Unauthorized: Admin session required.");
  }

  const orderId = String(formData.get("orderId") ?? "");
  const orderItemId = String(formData.get("orderItemId") ?? "");
  const unitIndex = parseInt(String(formData.get("unitIndex") ?? "1"), 10);
  const type = String(formData.get("type") ?? "invite");
  const inviteLink = String(formData.get("inviteLink") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!orderId || !orderItemId) return;

  let buyerName = "Pelanggan";
  let buyerEmail = "";

  if (process.env.DATABASE_URL) {
    await withTransaction(async (tx) => {
      const res = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);

      if (res.length > 0) {
        buyerName = res[0].buyerName;
        buyerEmail = res[0].buyerEmail;
        if (res[0].paymentStatus !== "paid") {
          throw new Error("Cannot fulfill unpaid order.");
        }
      } else {
        throw new Error("Order not found.");
      }

      // Upsert unit fulfillment
      await tx
        .insert(schema.orderFulfillmentUnits)
        .values({
          id: `unit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          orderId,
          orderItemId,
          unitIndex,
          type,
          inviteLink: inviteLink || null,
          username: username || null,
          secretCiphertext: password || null, // TODO: encrypt later
          notes: notes || null,
          unitStatus: "sent",
          sentAt: new Date(),
          deliveryStatus: "sent",
        })
        .onConflictDoUpdate({
          target: [schema.orderFulfillmentUnits.orderItemId, schema.orderFulfillmentUnits.unitIndex],
          set: {
            inviteLink: inviteLink || null,
            username: username || null,
            secretCiphertext: password || null,
            notes: notes || null,
            unitStatus: "sent",
            sentAt: new Date(),
          },
        });

      // Check if all active items are fulfilled to update order fulfillment_status
      const allItems = await tx
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, orderId));
      
      const allUnits = await tx
        .select()
        .from(schema.orderFulfillmentUnits)
        .where(eq(schema.orderFulfillmentUnits.orderId, orderId));
        
      let totalRequired = 0;
      allItems.forEach((i: typeof schema.orderItems.$inferSelect) => (totalRequired += i.qty));
      const totalSent = allUnits.filter((u: typeof schema.orderFulfillmentUnits.$inferSelect) => u.unitStatus === "sent").length;

      let newStatus = "pending";
      if (totalSent > 0) newStatus = "partial";
      if (totalSent >= totalRequired && totalRequired > 0) newStatus = "fulfilled";

      await tx
        .update(schema.orders)
        .set({ fulfillmentStatus: newStatus, updatedAt: new Date() })
        .where(eq(schema.orders.id, orderId));
        
    }).catch((e) => console.error("Fulfillment action error:", e));
  }

  // Trigger email to buyer
  if (buyerEmail) {
    await sendFulfillmentEmail({
      orderId,
      buyerName,
      buyerEmail,
      fulfillmentType: type,
      inviteLink: inviteLink || undefined,
      username: username || undefined,
      password: password || undefined,
      notes: notes || undefined,
    });
  }

  revalidatePath(`/admin/order/${orderId}`);
  revalidatePath(`/admin/order`);
}

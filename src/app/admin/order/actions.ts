"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendFulfillmentEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function updateOrderStatusAction(orderId: string, newStatus: string) {
  if (process.env.DATABASE_URL) {
    try {
      await db
        .update(schema.orders)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(schema.orders.id, orderId));
    } catch (e) {
      console.error("Update status error:", e);
    }
  }
  revalidatePath(`/admin/order/${orderId}`);
  revalidatePath(`/admin/order`);
}

export async function submitFulfillmentAction(formData: FormData) {
  const orderId = String(formData.get("orderId") ?? "");
  const fulfillmentType = String(formData.get("type") ?? "invite");
  const inviteLink = String(formData.get("inviteLink") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!orderId) return;

  let buyerName = "Pelanggan";
  let buyerEmail = "";

  if (process.env.DATABASE_URL) {
    try {
      const res = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);

      if (res.length > 0) {
        buyerName = res[0].buyerName;
        buyerEmail = res[0].buyerEmail;
      }

      // Upsert fulfillment record
      await db.insert(schema.orderFulfillments).values({
        id: `ful-${Date.now()}`,
        orderId,
        type: fulfillmentType,
        inviteLink: inviteLink || null,
        username: username || null,
        password: password || null,
        notes: notes || null,
      });

      // Update status order to fulfilled
      await db
        .update(schema.orders)
        .set({ status: "fulfilled", updatedAt: new Date() })
        .where(eq(schema.orders.id, orderId));
    } catch (e) {
      console.error("Fulfillment action error:", e);
    }
  }

  // Trigger email to buyer
  if (buyerEmail) {
    await sendFulfillmentEmail({
      orderId,
      buyerName,
      buyerEmail,
      fulfillmentType,
      inviteLink: inviteLink || undefined,
      username: username || undefined,
      password: password || undefined,
      notes: notes || undefined,
    });
  }

  revalidatePath(`/admin/order/${orderId}`);
  revalidatePath(`/admin/order`);
}

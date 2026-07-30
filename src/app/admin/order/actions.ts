"use server";

import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendFulfillmentEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin-auth";
import { withTransaction } from "@/db/tx";
import { encryptText } from "@/lib/crypto";
import { redirectWithFlash } from "@/lib/admin-flash";

export async function markOrderPaidAction(formData: FormData) {
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    redirectWithFlash("/admin/login", "err", "Sesi admin berakhir. Masuk lagi.");
  }

  const orderId = String(formData.get("orderId") ?? "").trim();
  const reference = String(formData.get("paymentReference") ?? "").trim();

  if (!orderId) {
    redirectWithFlash("/admin/order", "err", "Order ID kosong.");
  }

  if (!process.env.DATABASE_URL) {
    redirectWithFlash(
      `/admin/order/${orderId}`,
      "err",
      "DATABASE_URL belum diset — tidak bisa verifikasi bayar.",
    );
  }

  try {
    await withTransaction(async (tx) => {
      const orders = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);

      if (!orders[0]) throw new Error("Order tidak ditemukan");
      if (orders[0].paymentStatus !== "pending") {
        throw new Error(
          `Status bayar sekarang: ${orders[0].paymentStatus} (harus pending)`,
        );
      }

      await tx
        .update(schema.orders)
        .set({
          paymentStatus: "paid",
          status: "paid",
          paidAt: new Date(),
          verifiedBy: "admin",
          paymentReference: reference || null,
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, orderId));
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal verifikasi bayar";
    console.error("Mark paid error:", e);
    redirectWithFlash(`/admin/order/${orderId}`, "err", msg);
  }

  revalidatePath(`/admin/order/${orderId}`);
  revalidatePath(`/admin/order`);
  redirectWithFlash(
    `/admin/order/${orderId}`,
    "ok",
    reference
      ? `Pembayaran diverifikasi (ref: ${reference}).`
      : "Pembayaran diverifikasi. Silakan kirim unit akses.",
  );
}

export async function submitUnitFulfillmentAction(formData: FormData) {
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    redirectWithFlash("/admin/login", "err", "Sesi admin berakhir. Masuk lagi.");
  }

  const orderId = String(formData.get("orderId") ?? "");
  const orderItemId = String(formData.get("orderItemId") ?? "");
  const unitIndex = parseInt(String(formData.get("unitIndex") ?? "1"), 10);
  const type = String(formData.get("type") ?? "invite");
  const inviteLink = String(formData.get("inviteLink") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!orderId || !orderItemId) {
    redirectWithFlash("/admin/order", "err", "Data unit tidak lengkap.");
  }

  const detailPath = `/admin/order/${orderId}`;

  if (!process.env.DATABASE_URL) {
    redirectWithFlash(detailPath, "err", "DATABASE_URL belum diset.");
  }

  let buyerName = "Pelanggan";
  let buyerEmail = "";
  let emailPassword: string | undefined = password || undefined;

  try {
    await withTransaction(async (tx) => {
      const res = await tx
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);

      if (res.length === 0) throw new Error("Order tidak ditemukan.");
      buyerName = res[0].buyerName;
      buyerEmail = res[0].buyerEmail;
      if (res[0].paymentStatus !== "paid") {
        throw new Error("Order belum lunas — tidak bisa kirim akses.");
      }

      if (type === "invite" && !inviteLink) {
        throw new Error("Invite link wajib diisi.");
      }
      if (type === "credential" && !username) {
        throw new Error("Username wajib diisi.");
      }

      // Existing unit: keep old cipher if password left blank on resend
      const existing = await tx
        .select()
        .from(schema.orderFulfillmentUnits)
        .where(eq(schema.orderFulfillmentUnits.orderItemId, orderItemId))
        .limit(20);
      const prev = existing.find(
        (u: typeof schema.orderFulfillmentUnits.$inferSelect) =>
          u.unitIndex === unitIndex,
      );

      if (type === "credential" && !password && !prev?.secretCiphertext) {
        throw new Error("Password wajib untuk unit credential baru.");
      }

      const secretCiphertext = password
        ? encryptText(password)
        : (prev?.secretCiphertext ?? null);

      if (!password && prev) {
        // resend without new password — email will omit password unless we had plaintext (we don't)
        emailPassword = undefined;
      }

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
          secretCiphertext,
          notes: notes || null,
          unitStatus: "sent",
          sentAt: new Date(),
          deliveryStatus: "sent",
        })
        .onConflictDoUpdate({
          target: [
            schema.orderFulfillmentUnits.orderItemId,
            schema.orderFulfillmentUnits.unitIndex,
          ],
          set: {
            inviteLink: inviteLink || null,
            username: username || prev?.username || null,
            secretCiphertext,
            notes: notes || null,
            unitStatus: "sent",
            sentAt: new Date(),
            deliveryStatus: "sent",
          },
        });

      const allItems = await tx
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, orderId));

      const allUnits = await tx
        .select()
        .from(schema.orderFulfillmentUnits)
        .where(eq(schema.orderFulfillmentUnits.orderId, orderId));

      let totalRequired = 0;
      allItems.forEach((i: typeof schema.orderItems.$inferSelect) => {
        totalRequired += i.qty;
      });
      const totalSent = allUnits.filter(
        (u: typeof schema.orderFulfillmentUnits.$inferSelect) =>
          u.unitStatus === "sent",
      ).length;

      let newStatus = "pending";
      if (totalSent > 0) newStatus = "partial";
      if (totalSent >= totalRequired && totalRequired > 0) newStatus = "fulfilled";

      await tx
        .update(schema.orders)
        .set({ fulfillmentStatus: newStatus, updatedAt: new Date() })
        .where(eq(schema.orders.id, orderId));
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gagal simpan unit";
    console.error("Fulfillment action error:", e);
    redirectWithFlash(detailPath, "err", msg);
  }

  let emailNote = "";
  if (buyerEmail) {
    const mail = await sendFulfillmentEmail({
      orderId,
      buyerName,
      buyerEmail,
      fulfillmentType: type,
      inviteLink: inviteLink || undefined,
      username: username || undefined,
      password: emailPassword,
      notes: notes || undefined,
    });
    if (!mail.success) {
      emailNote =
        " Unit tersimpan, tapi email gagal terkirim — cek Resend / kirim ulang.";
    } else if ("mock" in mail && mail.mock) {
      emailNote = " (email mock — RESEND_API_KEY belum set).";
    }
  } else {
    emailNote = " Unit tersimpan; email pembeli kosong.";
  }

  revalidatePath(detailPath);
  revalidatePath(`/admin/order`);
  redirectWithFlash(
    detailPath,
    emailNote.includes("gagal") ? "err" : "ok",
    `Unit ${unitIndex} disimpan.${emailNote}`,
  );
}

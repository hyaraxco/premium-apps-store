"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { withTransaction } from "@/db/tx";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  lineSubtotalIdr,
  paymentExpiresAt,
  unitPriceIdr,
} from "@/lib/pricing";
import {
  createIdempotencyKey,
  createPublicOrderToken,
  generateOrderId,
} from "@/lib/order-token";

export type CheckoutInput = {
  buyerName: string;
  buyerEmail: string;
  buyerWhatsapp?: string;
  paymentMethod: "bca" | "seabank" | "qris";
  /** Optional client key for safe retries */
  idempotencyKey?: string;
  items: {
    productId: string;
    variantId: string;
    months?: number;
    quantity: number;
  }[];
};

export type CreateOrderResult =
  | { success: true; orderId: string; publicToken: string; totalIDR: number }
  | { success: false; error: string };

export async function createOrderAction(
  input: CheckoutInput,
): Promise<CreateOrderResult> {
  const emailKey = input.buyerEmail.trim().toLowerCase();
  const limitCheck = checkRateLimit(emailKey);
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: "Batas percobaan checkout terlampaui. Silakan tunggu 10 menit.",
    };
  }

  if (!input.buyerName?.trim() || !emailKey.includes("@")) {
    return { success: false, error: "Nama dan email valid wajib diisi." };
  }
  if (!input.items?.length) {
    return { success: false, error: "Keranjang belanja kosong." };
  }
  if (!["bca", "seabank", "qris"].includes(input.paymentMethod)) {
    return { success: false, error: "Metode pembayaran tidak valid." };
  }

  for (const item of input.items) {
    if (!item.productId || !item.variantId) {
      return { success: false, error: "Item keranjang tidak valid." };
    }
    if (item.quantity <= 0 || item.quantity > 10) {
      return { success: false, error: "Kuantitas tidak valid (1–10)." };
    }
    if (item.months != null && item.months <= 0) {
      return { success: false, error: "Durasi bulan tidak valid." };
    }
  }

  if (!process.env.DATABASE_URL) {
    return {
      success: false,
      error: "Database belum dikonfigurasi. Set DATABASE_URL untuk checkout.",
    };
  }

  const orderId = generateOrderId();
  const { raw: publicToken, hash: publicTokenHash } = createPublicOrderToken();
  const idempotencyKey = input.idempotencyKey?.trim() || createIdempotencyKey();
  const expires = paymentExpiresAt(input.paymentMethod);

  type BuiltLine = {
    item: typeof schema.orderItems.$inferInsert;
    productId: string;
    poolId: string;
    qty: number;
    email: {
      productName: string;
      variantLabel: string;
      qty: number;
      subtotalIDR: number;
    };
  };

  try {
    const result = await withTransaction(async (tx) => {
      // Idempotent retry: same key returns existing order
      if (input.idempotencyKey?.trim()) {
        const existing = await tx
          .select()
          .from(schema.orders)
          .where(eq(schema.orders.idempotencyKey, idempotencyKey))
          .limit(1);
        if (existing[0]) {
          return {
            kind: "existing" as const,
            orderId: existing[0].id,
            totalIDR: existing[0].totalIDR,
            // Cannot recover raw token; client should keep first response
            publicToken: "",
          };
        }
      }

      const lines: BuiltLine[] = [];
      let totalIDR = 0;
      /** Aggregate reserve qty per pool (same product multiple lines) */
      const reserveByPool = new Map<string, { productId: string; qty: number; name: string }>();

      for (const item of input.items) {
        const products = await tx
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, item.productId))
          .limit(1);
        const variants = await tx
          .select()
          .from(schema.productVariants)
          .where(eq(schema.productVariants.id, item.variantId))
          .limit(1);

        if (!products[0] || !variants[0]) {
          throw new Error("ITEM_NOT_FOUND");
        }
        const p = products[0];
        const v = variants[0];

        if (!p.isActive || !v.isActive) {
          throw new Error(`INACTIVE:${p.name}`);
        }
        if (v.productId !== p.id) {
          throw new Error("VARIANT_MISMATCH");
        }

        const poolId = v.inventoryPoolId ?? `pool-${p.id}`;
        const pools = await tx
          .select()
          .from(schema.inventoryPools)
          .where(eq(schema.inventoryPools.id, poolId))
          .limit(1);

        // Prefer pool by product if id missing
        const pool =
          pools[0] ??
          (
            await tx
              .select()
              .from(schema.inventoryPools)
              .where(eq(schema.inventoryPools.productId, p.id))
              .limit(1)
          )[0];

        if (!pool) {
          throw new Error(`NO_POOL:${p.name}`);
        }

        const months = item.months ?? v.durationMonths ?? 1;
        const unit = unitPriceIdr(v, months);
        const subtotal = lineSubtotalIdr(v, months, item.quantity);
        totalIDR += subtotal;

        const durationUnit = v.durationDays ? "day" : "month";
        const durationValue = v.durationDays ?? months;

        const prev = reserveByPool.get(pool.id);
        reserveByPool.set(pool.id, {
          productId: p.id,
          name: p.name,
          qty: (prev?.qty ?? 0) + item.quantity,
        });

        lines.push({
          productId: p.id,
          poolId: pool.id,
          qty: item.quantity,
          item: {
            id: `item-${orderId}-${lines.length + 1}-${Math.random().toString(36).slice(2, 7)}`,
            orderId,
            productId: p.id,
            variantId: v.id,
            productName: p.name,
            variantLabel: v.label,
            fulfillmentType: p.fulfillmentType,
            durationUnit,
            durationValue,
            months,
            qty: item.quantity,
            unitPriceIDR: unit,
            subtotalIDR: subtotal,
          },
          email: {
            productName: p.name,
            variantLabel: `${v.label}`,
            qty: item.quantity,
            subtotalIDR: subtotal,
          },
        });
      }

      // Atomic reserve per pool (must affect exactly 1 row each)
      for (const [poolId, { qty, name }] of reserveByPool) {
        const updated = await tx
          .update(schema.inventoryPools)
          .set({
            availableStock: sql`${schema.inventoryPools.availableStock} - ${qty}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.inventoryPools.id, poolId),
              gte(schema.inventoryPools.availableStock, qty),
            ),
          )
          .returning({ id: schema.inventoryPools.id });

        if (updated.length !== 1) {
          throw new Error(`STOCK:${name}`);
        }
      }

      await tx.insert(schema.orders).values({
        id: orderId,
        buyerName: input.buyerName.trim(),
        buyerEmail: emailKey,
        buyerWhatsapp: input.buyerWhatsapp?.trim() || null,
        paymentMethod: input.paymentMethod,
        totalIDR,
        status: "pending",
        paymentStatus: "pending",
        fulfillmentStatus: "pending",
        paymentExpiresAt: expires,
        publicTokenHash,
        idempotencyKey,
      });

      for (const line of lines) {
        await tx.insert(schema.orderItems).values(line.item);
      }

      return {
        kind: "created" as const,
        orderId,
        publicToken,
        totalIDR,
        emailItems: lines.map((l) => l.email),
      };
    });

    if (result.kind === "existing") {
      return {
        success: true,
        orderId: result.orderId,
        publicToken: result.publicToken,
        totalIDR: result.totalIDR,
      };
    }

    // Email outside transaction — failure does not roll back order
    await sendOrderConfirmationEmail({
      orderId: result.orderId,
      buyerName: input.buyerName.trim(),
      buyerEmail: emailKey,
      totalIDR: result.totalIDR,
      paymentMethod: input.paymentMethod,
      items: result.emailItems,
      publicToken: result.publicToken,
    }).catch((e) => console.error("order confirmation email failed", e));

    return {
      success: true,
      orderId: result.orderId,
      publicToken: result.publicToken,
      totalIDR: result.totalIDR,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.startsWith("STOCK:")) {
      return {
        success: false,
        error: `Stok ${msg.slice(6)} tidak mencukupi.`,
      };
    }
    if (msg === "ITEM_NOT_FOUND" || msg === "VARIANT_MISMATCH") {
      return { success: false, error: "Produk atau varian tidak valid." };
    }
    if (msg.startsWith("INACTIVE:")) {
      return { success: false, error: `${msg.slice(9)} tidak aktif.` };
    }
    if (msg.startsWith("NO_POOL:")) {
      return {
        success: false,
        error: `Stok ${msg.slice(8)} belum dikonfigurasi (inventory pool).`,
      };
    }
    console.error("Create order action error:", error);
    return { success: false, error: "Gagal memproses pesanan. Silakan coba lagi." };
  }
}

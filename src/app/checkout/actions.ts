"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { products as fallbackProducts } from "@/lib/products";

import { checkRateLimit } from "@/lib/rate-limit";

function generateOrderId(): string {
  const now = new Date();
  const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SB-${yyyymmdd}-${rand}`;
}

export type CheckoutInput = {
  buyerName: string;
  buyerEmail: string;
  buyerWhatsapp?: string;
  paymentMethod: "bca" | "seabank" | "qris";
  items: {
    productId: string;
    variantId: string;
    months?: number;
    quantity: number;
  }[];
};

export async function createOrderAction(input: CheckoutInput) {
  const limitCheck = checkRateLimit(input.buyerEmail.toLowerCase());
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: "Batas percobaan checkout terlampaui. Silakan tunggu 10 menit.",
    };
  }

  if (!input.buyerName || !input.buyerEmail) {
    return { success: false, error: "Nama dan Email wajib diisi." };
  }
  if (!input.items || input.items.length === 0) {
    return { success: false, error: "Keranjang belanja kosong." };
  }

  const orderId = generateOrderId();
  let totalIDR = 0;
  const orderItemsData: (typeof schema.orderItems.$inferInsert)[] = [];
  const emailItems: { productName: string; variantLabel: string; qty: number; subtotalIDR: number }[] = [];

  try {
    // Process if DB connected
    if (process.env.DATABASE_URL) {
      for (const item of input.items) {
        const rawProducts = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, item.productId))
          .limit(1);

        const rawVariants = await db
          .select()
          .from(schema.productVariants)
          .where(eq(schema.productVariants.id, item.variantId))
          .limit(1);

        if (rawProducts.length === 0 || rawVariants.length === 0) {
          return { success: false, error: `Produk atau Varian ${item.productId} tidak ditemukan.` };
        }

        const p = rawProducts[0];
        const v = rawVariants[0];

        if (v.stock < item.quantity) {
          return {
            success: false,
            error: `Stok untuk ${p.name} (${v.label}) tidak mencukupi (Tersedia: ${v.stock}).`,
          };
        }

        const itemMonths = item.months || 1;
        const basePrice = v.priceMonthlyIDR || v.priceIDR;
        const unitPrice = itemMonths === 12 && v.isPromo ? v.priceIDR : basePrice * itemMonths;
        const subtotal = unitPrice * item.quantity;
        totalIDR += subtotal;

        orderItemsData.push({
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          orderId,
          productId: p.id,
          variantId: v.id,
          productName: p.name,
          variantLabel: `${v.label} (${itemMonths}m)`,
          months: itemMonths,
          qty: item.quantity,
          unitPriceIDR: unitPrice,
          subtotalIDR: subtotal,
        });

        emailItems.push({
          productName: p.name,
          variantLabel: `${v.label} (${itemMonths}m)`,
          qty: item.quantity,
          subtotalIDR: subtotal,
        });
      }

      // Insert Order
      await db.insert(schema.orders).values({
        id: orderId,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail,
        buyerWhatsapp: input.buyerWhatsapp || null,
        paymentMethod: input.paymentMethod,
        totalIDR,
        status: "pending",
      });

      // Insert Order Items & decrement stock
      for (const itemData of orderItemsData) {
        await db.insert(schema.orderItems).values(itemData);
        await db
          .update(schema.productVariants)
          .set({
            stock: sql`${schema.productVariants.stock} - ${itemData.qty}`,
          })
          .where(eq(schema.productVariants.id, itemData.variantId));
      }
    } else {
      // Fallback for mock environment
      for (const item of input.items) {
        const p = fallbackProducts.find((x) => x.id === item.productId);
        const itemMonths = item.months || 1;
        const unitPrice = (p?.minPriceIDR || p?.price || 10000) * itemMonths;
        const subtotal = unitPrice * item.quantity;
        totalIDR += subtotal;

        emailItems.push({
          productName: p?.name || "Produk Digital",
          variantLabel: `${itemMonths} Bulan`,
          qty: item.quantity,
          subtotalIDR: subtotal,
        });
      }
    }

    // Trigger confirmation email
    await sendOrderConfirmationEmail({
      orderId,
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      totalIDR,
      paymentMethod: input.paymentMethod,
      items: emailItems,
    });

    return { success: true, orderId };
  } catch (error) {
    console.error("Create order action error:", error);
    return { success: false, error: "Gagal memproses pesanan. Silakan coba lagi." };
  }
}

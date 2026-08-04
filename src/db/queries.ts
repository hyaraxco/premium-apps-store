import "server-only";
import { db } from "./index";
import * as schema from "./schema";
import { eq, asc, and, gte, sum } from "drizzle-orm";
import type {
  Product,
  ProductStatus,
  ProductCategory,
  FulfillmentType,
} from "@/types/product";
import { products as fallbackProducts } from "@/lib/products";

// Badge logic lives in a pure module (unit-testable); re-exported here for
// backward-compatible imports.
export {
  BADGE_LOW_STOCK_THRESHOLD,
  BADGE_NEW_DAYS,
  BADGE_SALES_WINDOW_DAYS,
  computeBadge,
} from "@/lib/badges";
import { BADGE_SALES_WINDOW_DAYS, computeBadge } from "@/lib/badges";

/** Qty sold per product over the last 30 days — paid orders only, one query. */
export async function getSalesStats30d(): Promise<Map<string, number>> {
  const since = new Date(
    Date.now() - BADGE_SALES_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  const rows = await db
    .select({
      productId: schema.orderItems.productId,
      qtySold: sum(schema.orderItems.qty),
    })
    .from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
    .where(
      and(
        eq(schema.orders.paymentStatus, "paid"),
        gte(schema.orders.paidAt, since),
      ),
    )
    .groupBy(schema.orderItems.productId);

  const qtySoldByProduct = new Map<string, number>();
  for (const row of rows) {
    // Drizzle sum() returns string | null — coerce and default to 0.
    qtySoldByProduct.set(row.productId, Number(row.qtySold ?? 0));
  }
  return qtySoldByProduct;
}

function mapDbProduct(
  p: typeof schema.products.$inferSelect,
  vList: (typeof schema.productVariants.$inferSelect)[],
  poolStock: number,
  qtySoldByProduct: Map<string, number>,
): Product {
  const activeVariants = vList
    .filter((v) => v.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const prices = activeVariants.map((v) => v.priceIDR);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  // Shared pool — do NOT sum variant.stock
  const totalStock = Math.max(0, poolStock);

  let status: ProductStatus = "available";
  if (totalStock === 0) status = "out_of_stock";
  else if (totalStock <= 5) status = "limited";

  // Sales rank across the catalog — products with 0 sales get no rank (0).
  const qtySold = qtySoldByProduct.get(p.id) ?? 0;
  const rankOrder = [...qtySoldByProduct.entries()]
    .filter(([, qty]) => qty > 0)
    .sort((a, b) => b[1] - a[1]);
  const qtyRank = rankOrder.findIndex(([id]) => id === p.id) + 1;

  const delivery =
    p.fulfillmentType === "invite"
      ? "Invite email · 5–15 menit"
      : "Akun private · 10–30 menit";

  const licenseNote =
    p.fulfillmentType === "invite"
      ? "Akun baru atau perpanjang di akun sama"
      : "Credential private / sharing";

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.description,
    description: p.description,
    longDescription: p.longDescription,
    category: p.category as ProductCategory,
    fulfillmentType: p.fulfillmentType as FulfillmentType,
    sk: p.sk,
    garansi: p.garansi,
    badge: computeBadge({
      dbBadge: p.badge,
      stock: totalStock,
      qtySold,
      qtyRank,
      createdAt: p.createdAt,
    }),
    accent: p.accent,
    icon: p.icon,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
    variants: activeVariants.map((v) => ({
      id: v.id,
      productId: v.productId,
      label: v.label,
      durationDays: v.durationDays,
      durationMonths: v.durationMonths,
      priceMonthlyIDR: v.priceMonthlyIDR,
      priceIDR: v.priceIDR,
      isPromo: v.isPromo,
      stock: totalStock, // display pool stock on each variant for UI
      isActive: v.isActive,
      sortOrder: v.sortOrder,
    })),
    minPriceIDR: minPrice,
    totalStock,
    status,
    delivery,
    licenseNote,
    price: minPrice,
  };
}

export async function getProductsFromDb(options?: { includeInactive?: boolean }): Promise<Product[]> {
  if (!process.env.DATABASE_URL) {
    return fallbackProducts;
  }
  try {
    const includeInactive = options?.includeInactive ?? false;
    const rawProducts = includeInactive
      ? await db
          .select()
          .from(schema.products)
          .orderBy(asc(schema.products.sortOrder))
      : await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.isActive, true))
          .orderBy(asc(schema.products.sortOrder));

    if (!rawProducts.length) {
      // Honest empty — no silent demo catalog in production
      return [];
    }

    const rawVariants = await db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.isActive, true))
      .orderBy(asc(schema.productVariants.sortOrder));

    const pools = await db.select().from(schema.inventoryPools);
    const stockByProduct = new Map(
      pools.map((p) => [p.productId, p.availableStock] as const),
    );

    const qtySoldByProduct = await getSalesStats30d();

    return rawProducts.map((p) => {
      const vList = rawVariants.filter((v) => v.productId === p.id);
      const poolStock =
        stockByProduct.get(p.id) ??
        // expand-phase fallback: max variant stock if pool missing
        Math.max(0, ...vList.map((v) => v.stock), 0);
      return mapDbProduct(p, vList, poolStock, qtySoldByProduct);
    });
  } catch (error) {
    console.error("DB Query error (getProductsFromDb):", error);
    // PRD §5.1: No silent demo catalog when DATABASE_URL set.
    return [];
  }
}

export async function getProductBySlugFromDb(
  slug: string,
): Promise<Product | null> {
  if (!process.env.DATABASE_URL) {
    return fallbackProducts.find((p) => p.slug === slug) || null;
  }
  try {
    const rawProducts = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.slug, slug))
      .limit(1);

    if (rawProducts.length === 0) return null;

    const p = rawProducts[0];
    if (!p.isActive) return null;

    const rawVariants = await db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.productId, p.id))
      .orderBy(asc(schema.productVariants.sortOrder));

    const pools = await db
      .select()
      .from(schema.inventoryPools)
      .where(eq(schema.inventoryPools.productId, p.id))
      .limit(1);

    const poolStock =
      pools[0]?.availableStock ??
      Math.max(0, ...rawVariants.map((v) => v.stock), 0);

    const qtySoldByProduct = await getSalesStats30d();

    return mapDbProduct(p, rawVariants, poolStock, qtySoldByProduct);
  } catch (error) {
    console.error("DB Query error for slug:", slug, error);
    // PRD §5.1: No silent demo catalog when DATABASE_URL set.
    return null;
  }
}

export async function getRelatedProductsFromDb(
  product: Product,
  limit = 3,
): Promise<Product[]> {
  const all = await getProductsFromDb();
  return all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

import "server-only";
import { db } from "./index";
import * as schema from "./schema";
import { eq, asc } from "drizzle-orm";
import type {
  Product,
  ProductStatus,
  ProductCategory,
  FulfillmentType,
} from "@/types/product";
import { products as fallbackProducts } from "@/lib/products";

function mapDbProduct(
  p: typeof schema.products.$inferSelect,
  vList: (typeof schema.productVariants.$inferSelect)[],
  poolStock: number,
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
    badge: p.badge,
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

export async function getProductsFromDb(): Promise<Product[]> {
  if (!process.env.DATABASE_URL) {
    return fallbackProducts;
  }
  try {
    const rawProducts = await db
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

    return rawProducts.map((p) => {
      const vList = rawVariants.filter((v) => v.productId === p.id);
      const poolStock =
        stockByProduct.get(p.id) ??
        // expand-phase fallback: max variant stock if pool missing
        Math.max(0, ...vList.map((v) => v.stock), 0);
      return mapDbProduct(p, vList, poolStock);
    });
  } catch (error) {
    console.error("DB Query error:", error);
    // Fail closed when DB configured — do not serve stale mock inventory
    throw error;
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

    return mapDbProduct(p, rawVariants, poolStock);
  } catch (error) {
    console.error("DB Query error for slug:", slug, error);
    throw error;
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

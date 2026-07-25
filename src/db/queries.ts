import "server-only";
import { db } from "./index";
import * as schema from "./schema";
import { eq, asc } from "drizzle-orm";
import type { Product, ProductStatus, ProductCategory, FulfillmentType } from "@/types/product";
import { products as fallbackProducts } from "@/lib/products";

function mapDbProduct(
  p: typeof schema.products.$inferSelect,
  vList: (typeof schema.productVariants.$inferSelect)[]
): Product {
  const activeVariants = vList
    .filter((v) => v.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const prices = activeVariants.map((v) => v.priceIDR);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const totalStock = activeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);

  let status: ProductStatus = "available";
  if (totalStock === 0) {
    status = "out_of_stock";
  } else if (totalStock <= 5) {
    status = "limited";
  }

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
      stock: v.stock,
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

    if (!rawProducts || rawProducts.length === 0) {
      return fallbackProducts;
    }

    const rawVariants = await db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.isActive, true))
      .orderBy(asc(schema.productVariants.sortOrder));

    return rawProducts.map((p) => {
      const vList = rawVariants.filter((v) => v.productId === p.id);
      return mapDbProduct(p, vList);
    });
  } catch (error) {
    console.error("DB Query error, fallback to static mock:", error);
    return fallbackProducts;
  }
}

export async function getProductBySlugFromDb(slug: string): Promise<Product | null> {
  if (!process.env.DATABASE_URL) {
    return fallbackProducts.find((p) => p.slug === slug) || null;
  }
  try {
    const rawProducts = await db
      .select()
      .from(schema.products)
      .where(eq(schema.products.slug, slug))
      .limit(1);

    if (rawProducts.length === 0) {
      return fallbackProducts.find((p) => p.slug === slug) || null;
    }

    const p = rawProducts[0];
    const rawVariants = await db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.productId, p.id))
      .orderBy(asc(schema.productVariants.sortOrder));

    return mapDbProduct(p, rawVariants);
  } catch (error) {
    console.error("DB Query error for slug:", slug, error);
    return fallbackProducts.find((p) => p.slug === slug) || null;
  }
}

export async function getRelatedProductsFromDb(
  product: Product,
  limit = 3
): Promise<Product[]> {
  const all = await getProductsFromDb();
  return all
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}

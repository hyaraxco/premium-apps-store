"use server";

import { randomBytes } from "crypto";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyAdminSession } from "@/lib/admin-auth";
import { redirectWithFlash } from "@/lib/admin-flash";
import { logAdminAudit } from "@/lib/admin-audit";
import { withTransaction } from "@/db/tx";
import {
  productFormSchema,
  variantFormSchema,
  slugify,
  type ProductFormState,
  type VariantFormData,
} from "@/lib/product-forms";

export async function updatePoolStockAction(formData: FormData) {
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    redirectWithFlash("/admin/login", "err", "Sesi admin berakhir.");
  }

  const productId = String(formData.get("productId") ?? "").trim();
  const raw = String(formData.get("stock") ?? "0");
  const newStock = parseInt(raw, 10);

  if (!productId || Number.isNaN(newStock)) {
    redirectWithFlash("/admin/produk", "err", "Stok atau produk tidak valid.");
  }

  if (!process.env.DATABASE_URL) {
    redirectWithFlash("/admin/produk", "err", "DATABASE_URL belum diset.");
  }

  try {
    await db
      .update(schema.inventoryPools)
      .set({ availableStock: Math.max(0, newStock), updatedAt: new Date() })
      .where(eq(schema.inventoryPools.productId, productId));

    logAdminAudit({
      action: "stock.update_pool",
      details: { productId, newStock: Math.max(0, newStock) },
    });
  } catch (e) {
    console.error("Update pool stock error:", e);
    redirectWithFlash("/admin/produk", "err", "Gagal update stok pool.");
  }

  revalidatePath("/admin/produk");
  revalidatePath("/katalog");
  redirectWithFlash(
    "/admin/produk",
    "ok",
    `Stok pool diperbarui → ${Math.max(0, newStock)}.`,
  );
}

export async function toggleProductActiveAction(formData: FormData) {
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    redirectWithFlash("/admin/login", "err", "Sesi admin berakhir.");
  }

  const productId = String(formData.get("productId") ?? "").trim();
  const currentActive = String(formData.get("currentActive") ?? "") === "true";

  if (!productId) {
    redirectWithFlash("/admin/produk", "err", "Produk tidak valid.");
  }

  if (!process.env.DATABASE_URL) {
    redirectWithFlash("/admin/produk", "err", "DATABASE_URL belum diset.");
  }

  try {
    await db
      .update(schema.products)
      .set({ isActive: !currentActive })
      .where(eq(schema.products.id, productId));

    logAdminAudit({
      action: "product.toggle_active",
      details: { productId, nextActive: !currentActive },
    });
  } catch (e) {
    console.error("Toggle product active error:", e);
    redirectWithFlash("/admin/produk", "err", "Gagal ubah status produk.");
  }

  revalidatePath("/admin/produk");
  revalidatePath("/katalog");
  redirectWithFlash(
    "/admin/produk",
    "ok",
    currentActive ? "Produk dinonaktifkan dari katalog." : "Produk diaktifkan.",
  );
}

// ---------------------------------------------------------------------------
// Shared helpers (new actions return { ok: true | false, ... } state objects,
// never throw to the UI — see src/lib/product-forms.ts ProductFormState).
// ---------------------------------------------------------------------------

function intFromForm(formData: FormData, key: string, fallback = 0): number {
  const raw = String(formData.get(key) ?? "").trim();
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? fallback : n;
}

function boolFromForm(formData: FormData, key: string): boolean {
  const raw = formData.get(key);
  return raw === "on" || raw === "true" || raw === "1";
}

/** Normalize badge override: "" or "Auto" → null (computed badge wins). */
function normalizeBadge(value: string): string | null {
  return value === "" || value === "Auto" ? null : value;
}

function revalidateAllProductPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/katalog");
  revalidatePath("/admin/produk");
  revalidatePath(`/apps/${slug}`);
  // apps/[slug] uses generateStaticParams — also invalidate the pattern.
  revalidatePath("/apps/[slug]", "page");
}

async function requireAuthedAdmin(): Promise<boolean> {
  const isAuthed = await verifyAdminSession();
  if (!isAuthed) {
    redirectWithFlash("/admin/login", "err", "Sesi admin berakhir.");
  }
  return true;
}

// ---------------------------------------------------------------------------
// Product CRUD
// ---------------------------------------------------------------------------

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAuthedAdmin();
  if (!process.env.DATABASE_URL) {
    return { ok: false, message: "DATABASE_URL belum diset." };
  }

  const autoSlug = boolFromForm(formData, "autoSlug");
  const parsed = productFormSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    slug: formData.get("slug"),
    autoSlug,
    category: formData.get("category"),
    fulfillmentType: formData.get("fulfillmentType"),
    description: formData.get("description"),
    longDescription: formData.get("longDescription"),
    sk: formData.get("sk"),
    garansi: formData.get("garansi"),
    accent: String(formData.get("accent") ?? "") || "#10A37F",
    icon: String(formData.get("icon") ?? "") || "P",
    sortOrder: formData.get("sortOrder") ?? "0",
    badge: String(formData.get("badge") ?? ""),
    isActive: boolFromForm(formData, "isActive"),
  });

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const slug = autoSlug ? slugify(data.name) : (data.slug ?? "");
  if (!slug) {
    return {
      ok: false,
      errors: { slug: ["Nama tidak bisa dijadikan slug — matikan Auto dan tulis slug manual."] },
    };
  }

  // Optional first variant (only when a label was provided).
  const vLabel = String(formData.get("variantLabel") ?? "").trim();
  let firstVariant: VariantFormData | null = null;
  if (vLabel) {
    const vParsed = variantFormSchema.safeParse({
      label: vLabel,
      durationDays: formData.get("variantDurationDays"),
      durationMonths: formData.get("variantDurationMonths"),
      priceIDR: formData.get("variantPriceIDR"),
      priceMonthlyIDR: formData.get("variantPriceMonthlyIDR"),
      isPromo: boolFromForm(formData, "variantIsPromo"),
      sortOrder: 1,
    });
    if (!vParsed.success) {
      const vErrors: Record<string, string[] | undefined> = {};
      for (const [key, values] of Object.entries(vParsed.error.flatten().fieldErrors)) {
        vErrors[`variant${key.charAt(0).toUpperCase()}${key.slice(1)}`] = values;
      }
      return { ok: false, errors: vErrors };
    }
    firstVariant = vParsed.data;
  }

  try {
    // Slug-based id (repo convention). On collision append a short random
    // suffix to both id and slug so the unique constraints stay satisfied.
    const productId = await withTransaction(async (tx) => {
      let id = slug;
      for (let attempt = 0; attempt < 4; attempt++) {
        const existing = await tx
          .select({ id: schema.products.id })
          .from(schema.products)
          .where(eq(schema.products.id, id))
          .limit(1);
        if (existing.length === 0) break;
        id = `${slug}-${randomBytes(3).toString("hex")}`;
      }

      await tx.insert(schema.products).values({
        id,
        slug: id,
        name: data.name,
        category: data.category,
        fulfillmentType: data.fulfillmentType,
        description: data.description,
        longDescription: data.longDescription,
        sk: data.sk,
        garansi: data.garansi,
        badge: normalizeBadge(data.badge),
        accent: data.accent,
        icon: data.icon,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      });

      const poolId = `pool-${id}`;
      await tx.insert(schema.inventoryPools).values({
        id: poolId,
        productId: id,
        availableStock: Math.max(0, intFromForm(formData, "initialStock", 0)),
        updatedAt: new Date(),
      });

      if (firstVariant) {
        let variantId = `${id}-${slugify(firstVariant.label) || "varian"}`;
        for (let attempt = 0; attempt < 4; attempt++) {
          const existing = await tx
            .select({ id: schema.productVariants.id })
            .from(schema.productVariants)
            .where(eq(schema.productVariants.id, variantId))
            .limit(1);
          if (existing.length === 0) break;
          variantId = `${id}-${slugify(firstVariant.label) || "varian"}-${randomBytes(3).toString("hex")}`;
        }
        await tx.insert(schema.productVariants).values({
          id: variantId,
          productId: id,
          inventoryPoolId: poolId,
          label: firstVariant.label,
          durationDays: firstVariant.durationDays,
          durationMonths: firstVariant.durationMonths,
          priceMonthlyIDR: firstVariant.priceMonthlyIDR,
          priceIDR: firstVariant.priceIDR,
          isPromo: firstVariant.isPromo,
          stock: 0,
          isActive: true,
          sortOrder: 1,
        });
      }

      return id;
    });

    logAdminAudit({
      action: "product.create",
      details: { productId, slug, name: data.name },
    });
    revalidateAllProductPaths(productId);
    return { ok: true, message: `Produk "${data.name}" berhasil dibuat.` };
  } catch (e) {
    console.error("Create product error:", e);
    return { ok: false, message: "Gagal menyimpan produk. Coba lagi." };
  }
}

export async function updateProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAuthedAdmin();
  if (!process.env.DATABASE_URL) {
    return { ok: false, message: "DATABASE_URL belum diset." };
  }

  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) {
    return { ok: false, message: "Produk tidak valid." };
  }

  const autoSlug = boolFromForm(formData, "autoSlug");
  const parsed = productFormSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    slug: formData.get("slug"),
    autoSlug,
    category: formData.get("category"),
    fulfillmentType: formData.get("fulfillmentType"),
    description: formData.get("description"),
    longDescription: formData.get("longDescription"),
    sk: formData.get("sk"),
    garansi: formData.get("garansi"),
    accent: String(formData.get("accent") ?? "") || "#10A37F",
    icon: String(formData.get("icon") ?? "") || "P",
    sortOrder: formData.get("sortOrder") ?? "0",
    badge: String(formData.get("badge") ?? ""),
    isActive: boolFromForm(formData, "isActive"),
  });

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const newSlug = autoSlug ? slugify(data.name) : (data.slug ?? "");
  if (!newSlug) {
    return {
      ok: false,
      errors: { slug: ["Nama tidak bisa dijadikan slug — matikan Auto dan tulis slug manual."] },
    };
  }

  try {
    const existing = await db
      .select({ id: schema.products.id, slug: schema.products.slug })
      .from(schema.products)
      .where(eq(schema.products.id, productId))
      .limit(1);
    if (existing.length === 0) {
      return { ok: false, message: "Produk tidak ditemukan." };
    }

    const dupSlug = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(and(eq(schema.products.slug, newSlug), ne(schema.products.id, productId)))
      .limit(1);
    if (dupSlug.length > 0) {
      return { ok: false, errors: { slug: ["Slug sudah dipakai produk lain."] } };
    }

    await db
      .update(schema.products)
      .set({
        slug: newSlug,
        name: data.name,
        category: data.category,
        fulfillmentType: data.fulfillmentType,
        description: data.description,
        longDescription: data.longDescription,
        sk: data.sk,
        garansi: data.garansi,
        badge: normalizeBadge(data.badge),
        accent: data.accent,
        icon: data.icon,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      })
      .where(eq(schema.products.id, productId));

    logAdminAudit({
      action: "product.update",
      details: { productId, slug: newSlug, name: data.name },
    });
    revalidateAllProductPaths(newSlug);
    if (existing[0].slug !== newSlug) {
      // Old slug still cached — invalidate it too.
      revalidatePath(`/apps/${existing[0].slug}`);
      revalidatePath("/apps/[slug]", "page");
    }
    return { ok: true, message: `Produk "${data.name}" diperbarui.` };
  } catch (e) {
    console.error("Update product error:", e);
    return { ok: false, message: "Gagal memperbarui produk. Coba lagi." };
  }
}

export async function softDeleteProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAuthedAdmin();
  if (!process.env.DATABASE_URL) {
    return { ok: false, message: "DATABASE_URL belum diset." };
  }

  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) {
    return { ok: false, message: "Produk tidak valid." };
  }

  try {
    const existing = await db
      .select({ id: schema.products.id, slug: schema.products.slug, name: schema.products.name })
      .from(schema.products)
      .where(eq(schema.products.id, productId))
      .limit(1);
    if (existing.length === 0) {
      return { ok: false, message: "Produk tidak ditemukan." };
    }

    // Soft delete: hide from catalog (existing isActive filters), keep order history.
    await db
      .update(schema.products)
      .set({ isActive: false })
      .where(eq(schema.products.id, productId));

    logAdminAudit({
      action: "product.soft_delete",
      details: { productId, name: existing[0].name },
    });
    revalidateAllProductPaths(existing[0].slug);
    return { ok: true, message: `Produk "${existing[0].name}" dinonaktifkan dari katalog.` };
  } catch (e) {
    console.error("Soft delete product error:", e);
    return { ok: false, message: "Gagal menonaktifkan produk. Coba lagi." };
  }
}

// ---------------------------------------------------------------------------
// Variant CRUD
// ---------------------------------------------------------------------------

export async function createVariantAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAuthedAdmin();
  if (!process.env.DATABASE_URL) {
    return { ok: false, message: "DATABASE_URL belum diset." };
  }

  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) {
    return { ok: false, message: "Produk tidak valid." };
  }

  const parsed = variantFormSchema.safeParse({
    label: formData.get("label"),
    durationDays: formData.get("durationDays"),
    durationMonths: formData.get("durationMonths"),
    priceIDR: formData.get("priceIDR"),
    priceMonthlyIDR: formData.get("priceMonthlyIDR"),
    isPromo: boolFromForm(formData, "isPromo"),
    sortOrder: formData.get("sortOrder") ?? "0",
  });

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  try {
    const product = await db
      .select({ id: schema.products.id, slug: schema.products.slug })
      .from(schema.products)
      .where(eq(schema.products.id, productId))
      .limit(1);
    if (product.length === 0) {
      return { ok: false, message: "Produk tidak ditemukan." };
    }

    const pool = await db
      .select({ id: schema.inventoryPools.id })
      .from(schema.inventoryPools)
      .where(eq(schema.inventoryPools.productId, productId))
      .limit(1);

    const variantId = await withTransaction(async (tx) => {
      const base = `${productId}-${slugify(data.label) || "varian"}`;
      let id = base;
      for (let attempt = 0; attempt < 4; attempt++) {
        const existing = await tx
          .select({ id: schema.productVariants.id })
          .from(schema.productVariants)
          .where(eq(schema.productVariants.id, id))
          .limit(1);
        if (existing.length === 0) break;
        id = `${base}-${randomBytes(3).toString("hex")}`;
      }

      await tx.insert(schema.productVariants).values({
        id,
        productId,
        inventoryPoolId: pool[0]?.id ?? null,
        label: data.label,
        durationDays: data.durationDays,
        durationMonths: data.durationMonths,
        priceMonthlyIDR: data.priceMonthlyIDR,
        priceIDR: data.priceIDR,
        isPromo: data.isPromo,
        stock: 0,
        isActive: true,
        sortOrder: data.sortOrder,
      });
      return id;
    });

    logAdminAudit({
      action: "variant.create",
      details: { variantId, productId, label: data.label },
    });
    revalidateAllProductPaths(product[0].slug);
    return { ok: true, message: `Varian "${data.label}" ditambahkan.` };
  } catch (e) {
    console.error("Create variant error:", e);
    return { ok: false, message: "Gagal menambah varian. Coba lagi." };
  }
}

export async function updateVariantAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAuthedAdmin();
  if (!process.env.DATABASE_URL) {
    return { ok: false, message: "DATABASE_URL belum diset." };
  }

  const variantId = String(formData.get("variantId") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();
  if (!variantId || !productId) {
    return { ok: false, message: "Varian tidak valid." };
  }

  const parsed = variantFormSchema.safeParse({
    label: formData.get("label"),
    durationDays: formData.get("durationDays"),
    durationMonths: formData.get("durationMonths"),
    priceIDR: formData.get("priceIDR"),
    priceMonthlyIDR: formData.get("priceMonthlyIDR"),
    isPromo: boolFromForm(formData, "isPromo"),
    sortOrder: formData.get("sortOrder") ?? "0",
  });

  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  try {
    const product = await db
      .select({ id: schema.products.id, slug: schema.products.slug })
      .from(schema.products)
      .where(eq(schema.products.id, productId))
      .limit(1);
    if (product.length === 0) {
      return { ok: false, message: "Produk tidak ditemukan." };
    }

    const updated = await db
      .update(schema.productVariants)
      .set({
        label: data.label,
        durationDays: data.durationDays,
        durationMonths: data.durationMonths,
        priceMonthlyIDR: data.priceMonthlyIDR,
        priceIDR: data.priceIDR,
        isPromo: data.isPromo,
        sortOrder: data.sortOrder,
      })
      .where(and(eq(schema.productVariants.id, variantId), eq(schema.productVariants.productId, productId)));

    if (!updated.rowCount || updated.rowCount === 0) {
      return { ok: false, message: "Varian tidak ditemukan." };
    }

    logAdminAudit({
      action: "variant.update",
      details: { variantId, productId, label: data.label },
    });
    revalidateAllProductPaths(product[0].slug);
    return { ok: true, message: `Varian "${data.label}" diperbarui.` };
  } catch (e) {
    console.error("Update variant error:", e);
    return { ok: false, message: "Gagal memperbarui varian. Coba lagi." };
  }
}

export async function deleteVariantAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAuthedAdmin();
  if (!process.env.DATABASE_URL) {
    return { ok: false, message: "DATABASE_URL belum diset." };
  }

  const variantId = String(formData.get("variantId") ?? "").trim();
  if (!variantId) {
    return { ok: false, message: "Varian tidak valid." };
  }

  try {
    const variant = await db
      .select({ id: schema.productVariants.id, productId: schema.productVariants.productId })
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, variantId))
      .limit(1);
    if (variant.length === 0) {
      return { ok: false, message: "Varian tidak ditemukan." };
    }

    const product = await db
      .select({ id: schema.products.id, slug: schema.products.slug })
      .from(schema.products)
      .where(eq(schema.products.id, variant[0].productId))
      .limit(1);

    // order_items.variant_id is a plain varchar (no FK) — count refs manually.
    const refs = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.orderItems)
      .where(eq(schema.orderItems.variantId, variantId));
    const refCount = Number(refs[0]?.count ?? 0);

    if (refCount === 0) {
      await db
        .delete(schema.productVariants)
        .where(eq(schema.productVariants.id, variantId));
      logAdminAudit({
        action: "variant.delete",
        details: { variantId, productId: variant[0].productId, hard: true },
      });
    } else {
      // Referenced by orders — soft delete instead of breaking history.
      await db
        .update(schema.productVariants)
        .set({ isActive: false })
        .where(eq(schema.productVariants.id, variantId));
      logAdminAudit({
        action: "variant.soft_delete",
        details: { variantId, productId: variant[0].productId, orderRefs: refCount },
      });
    }

    revalidateAllProductPaths(product[0]?.slug ?? variant[0].productId);
    return {
      ok: true,
      message:
        refCount === 0
          ? "Varian dihapus permanen."
          : "Varian dinonaktifkan (masih ada riwayat pesanan).",
    };
  } catch (e) {
    console.error("Delete variant error:", e);
    return { ok: false, message: "Gagal menghapus varian. Coba lagi." };
  }
}

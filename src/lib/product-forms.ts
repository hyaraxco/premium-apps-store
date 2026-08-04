import { z } from "zod";

/**
 * Shared state contract for admin product/variant server actions.
 * Actions return this shape and never throw to the UI:
 *   { ok: true }                        — success
 *   { ok: false, errors }               — zod field errors (flatten)
 *   { ok: false, message }              — business error message
 */
export type ProductFormState =
  | { ok: true; message?: string }
  | {
      ok: false;
      errors?: Record<string, string[] | undefined>;
      message?: string;
    };

/** Categories from src/lib/products.ts (excluding the "all" pseudo-category). */
export const PRODUCT_CATEGORIES = [
  "productivity",
  "design",
  "developer",
  "ai",
  "media",
  "security",
] as const;

/** Badge override values. "" = auto (computed badge wins). */
export const BADGE_OVERRIDES = [
  "",
  "Segera habis",
  "Best seller",
  "Hot",
  "Baru",
] as const;

export const BADGE_OVERRIDE_LABELS: Record<string, string> = {
  "": "Auto (komputasi)",
  "Segera habis": "Segera habis",
  "Best seller": "Best seller",
  Hot: "Hot",
  Baru: "Baru",
};

/**
 * Slug convention: lowercase, trimmed, spaces → dashes, only a-z 0-9 -.
 * Collapses repeated dashes and strips leading/trailing dashes.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Optional positive int; empty string / missing → null. */
const nullablePositiveInt = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(v)),
  z.number().int("Harus angka bulat.").positive("Harus lebih dari 0.").nullable(),
);

export const variantFormSchema = z
  .object({
    label: z.string().trim().min(1, "Label varian wajib diisi.").max(128),
    durationDays: nullablePositiveInt,
    durationMonths: nullablePositiveInt,
    priceIDR: z.coerce.number().int("Harus angka bulat.").positive("Harga wajib lebih dari 0."),
    priceMonthlyIDR: nullablePositiveInt,
    isPromo: z.boolean(),
    sortOrder: z.coerce.number().int(),
  })
  .superRefine((data, ctx) => {
    const hasDays = data.durationDays != null;
    const hasMonths = data.durationMonths != null;
    if (hasDays === hasMonths) {
      ctx.addIssue({
        code: "custom",
        path: ["durationDays"],
        message: "Isi tepat satu: durasi hari ATAU bulan (bukan keduanya / kosong).",
      });
    }
  });

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Nama produk wajib diisi.").max(256),
  // Disabled input when autoSlug is on → absent from FormData → optional.
  slug: z
    .string()
    .trim()
    .min(1, "Slug wajib diisi.")
    .max(128)
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh a-z, 0-9, dan tanda strip.")
    .optional(),
  autoSlug: z.boolean(),
  category: z.enum(PRODUCT_CATEGORIES, { message: "Kategori tidak valid." }),
  fulfillmentType: z.enum(["invite", "credential"], {
    message: "Tipe fulfillment tidak valid.",
  }),
  description: z.string().trim().min(1, "Deskripsi wajib diisi."),
  longDescription: z.string().trim().min(1, "Deskripsi panjang wajib diisi."),
  sk: z.preprocess((v) => (v === "" || v == null ? null : v), z.string().nullable()),
  garansi: z.preprocess((v) => (v === "" || v == null ? null : v), z.string().nullable()),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Warna aksen harus hex 6 digit, contoh #10A37F."),
  icon: z.string().trim().min(1, "Ikon wajib diisi.").max(2, "Ikon maksimal 2 karakter."),
  sortOrder: z.coerce.number().int(),
  badge: z.enum(BADGE_OVERRIDES),
  isActive: z.boolean(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
export type VariantFormData = z.infer<typeof variantFormSchema>;

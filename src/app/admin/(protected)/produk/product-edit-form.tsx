"use client";

import { useActionState, useState } from "react";
import {
  createVariantAction,
  deleteVariantAction,
  updateProductAction,
  updateVariantAction,
} from "./actions";
import {
  BADGE_OVERRIDES,
  BADGE_OVERRIDE_LABELS,
  slugify,
  type ProductFormState,
} from "@/lib/product-forms";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { formatIDR } from "@/lib/format";
import type { Product, ProductVariant } from "@/types/product";

type Props = {
  product: Product;
  categories: { value: string; label: string }[];
};

const labelCls = "block text-sm font-medium text-ink";
const inputCls =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50";
const checkCls = "h-4 w-4 rounded border-line bg-paper accent-ink";

export function ProductEditForm({ product, categories }: Props) {
  const [state, formAction] = useActionState<ProductFormState, FormData>(
    updateProductAction,
    { ok: false },
  );
  const [autoSlug, setAutoSlug] = useState(false);
  const [slug, setSlug] = useState(product.slug);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="productId" value={product.id} />

      {state.ok && state.message && (
        <div
          role="status"
          className="rounded-lg border border-emerald-600/25 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-950 dark:text-emerald-100"
        >
          {state.message}
        </div>
      )}
      {!state.ok && state.message && (
        <div
          role="alert"
          className="rounded-lg border border-rose-600/25 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-950 dark:text-rose-100"
        >
          {state.message}
        </div>
      )}

      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="stamp text-ink/45">Info dasar</legend>

        <div className="sm:col-span-2">
          <label htmlFor={`pname-${product.id}`} className={labelCls}>
            Nama produk *
          </label>
          <input
            id={`pname-${product.id}`}
            name="name"
            required
            defaultValue={product.name}
            onChange={(e) => {
              if (autoSlug) setSlug(slugify(e.target.value));
            }}
            className={`${inputCls} mt-1.5`}
          />
          {!state.ok && state.errors?.name?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor={`pslug-${product.id}`} className={labelCls}>
            Slug
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id={`pslug-${product.id}`}
              name="slug"
              value={slug}
              disabled={autoSlug}
              onChange={(e) => {
                setSlug(e.target.value);
                setAutoSlug(false);
              }}
              className={inputCls}
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs text-ink/60">
              <input
                type="checkbox"
                name="autoSlug"
                checked={autoSlug}
                onChange={(e) => {
                  setAutoSlug(e.target.checked);
                  if (e.target.checked) setSlug(slugify(product.name));
                }}
                className={checkCls}
              />
              Auto
            </label>
          </div>
          {!state.ok && state.errors?.slug?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.slug[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor={`pcategory-${product.id}`} className={labelCls}>
            Kategori *
          </label>
          <select
            id={`pcategory-${product.id}`}
            name="category"
            defaultValue={product.category}
            className={`${inputCls} mt-1.5`}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {!state.ok && state.errors?.category?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.category[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor={`pfulfillment-${product.id}`} className={labelCls}>
            Fulfillment *
          </label>
          <select
            id={`pfulfillment-${product.id}`}
            name="fulfillmentType"
            defaultValue={product.fulfillmentType}
            className={`${inputCls} mt-1.5`}
          >
            <option value="invite">Invite link</option>
            <option value="credential">Credential</option>
          </select>
          {!state.ok && state.errors?.fulfillmentType?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.fulfillmentType[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor={`picon-${product.id}`} className={labelCls}>
            Ikon (1–2 karakter) *
          </label>
          <input
            id={`picon-${product.id}`}
            name="icon"
            maxLength={2}
            defaultValue={product.icon}
            className={`${inputCls} mt-1.5`}
          />
          {!state.ok && state.errors?.icon?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.icon[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor={`paccent-${product.id}`} className={labelCls}>
            Warna aksen (hex) *
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id={`paccent-${product.id}`}
              name="accent"
              type="color"
              defaultValue={product.accent}
              className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-paper p-1"
            />
            <input
              name="accentText"
              type="text"
              defaultValue={product.accent}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                  const color = document.getElementById(
                    `paccent-${product.id}`,
                  ) as HTMLInputElement | null;
                  if (color) color.value = v;
                }
              }}
              className={inputCls}
            />
          </div>
          {!state.ok && state.errors?.accent?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.accent[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor={`psort-${product.id}`} className={labelCls}>
            Urutan tampil
          </label>
          <input
            id={`psort-${product.id}`}
            name="sortOrder"
            type="number"
            defaultValue={product.sortOrder}
            className={`${inputCls} mt-1.5`}
          />
          {!state.ok && state.errors?.sortOrder?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.sortOrder[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor={`pbadge-${product.id}`} className={labelCls}>
            Badge override
          </label>
          <select
            id={`pbadge-${product.id}`}
            name="badge"
            defaultValue={product.badge ?? ""}
            className={`${inputCls} mt-1.5`}
          >
            {BADGE_OVERRIDES.map((b) => (
              <option key={b} value={b}>
                {BADGE_OVERRIDE_LABELS[b]}
              </option>
            ))}
          </select>
          {!state.ok && state.errors?.badge?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.badge[0]}</p>
          )}
        </div>

        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={product.isActive}
              className={checkCls}
            />
            Tayang di katalog
          </label>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor={`pdesc-${product.id}`} className={labelCls}>
            Deskripsi singkat *
          </label>
          <textarea
            id={`pdesc-${product.id}`}
            name="description"
            required
            rows={2}
            defaultValue={product.description}
            className={`${inputCls} mt-1.5 resize-y`}
          />
          {!state.ok && state.errors?.description?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.description[0]}</p>
          )}
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor={`plongdesc-${product.id}`} className={labelCls}>
            Deskripsi panjang *
          </label>
          <textarea
            id={`plongdesc-${product.id}`}
            name="longDescription"
            required
            rows={3}
            defaultValue={product.longDescription}
            className={`${inputCls} mt-1.5 resize-y`}
          />
          {!state.ok && state.errors?.longDescription?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.longDescription[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor={`psk-${product.id}`} className={labelCls}>
            Syarat &amp; Ketentuan
          </label>
          <textarea
            id={`psk-${product.id}`}
            name="sk"
            rows={3}
            defaultValue={product.sk ?? ""}
            className={`${inputCls} mt-1.5 resize-y`}
          />
          {!state.ok && state.errors?.sk?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.sk[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor={`pgaransi-${product.id}`} className={labelCls}>
            Ketentuan garansi
          </label>
          <textarea
            id={`pgaransi-${product.id}`}
            name="garansi"
            rows={3}
            defaultValue={product.garansi ?? ""}
            className={`${inputCls} mt-1.5 resize-y`}
          />
          {!state.ok && state.errors?.garansi?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.garansi[0]}</p>
          )}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <PendingSubmitButton pendingLabel="Menyimpan…" className="w-full sm:w-auto">
          Simpan perubahan
        </PendingSubmitButton>
        <p className="stamp text-ink/40">
          Stok pool diatur lewat kolom Set di tabel — form ini tidak menyentuh stok
        </p>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Variant management (add / edit / delete with soft-delete semantics)
// ---------------------------------------------------------------------------

export function VariantsManager({
  productId,
  variants,
}: {
  productId: string;
  variants: ProductVariant[];
}) {
  return (
    <div className="mt-8 border-t border-line pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Varian harga</h3>
          <p className="stamp text-ink/45">{variants.length} varian aktif</p>
        </div>
        <details className="group">
          <summary className="cursor-pointer list-none rounded-lg border border-line bg-paper px-3.5 py-2 text-sm font-medium text-ink hover:bg-sand/60 [&::-webkit-details-marker]:hidden">
            + Tambah varian
          </summary>
          <div className="mt-4 rounded-xl border border-line bg-sand/20 p-4">
            <VariantForm productId={productId} />
          </div>
        </details>
      </div>

      {variants.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line p-4 text-sm text-ink/60">
          Belum ada varian — tambahkan minimal satu agar produk bisa dibeli.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {variants.map((v) => (
            <VariantRow key={v.id} productId={productId} variant={v} />
          ))}
        </ul>
      )}
    </div>
  );
}

function VariantRow({
  productId,
  variant,
}: {
  productId: string;
  variant: ProductVariant;
}) {
  const [state, formAction] = useActionState<ProductFormState, FormData>(
    deleteVariantAction,
    { ok: false },
  );
  const durationLabel = variant.durationDays
    ? `${variant.durationDays} hari`
    : variant.durationMonths
      ? `${variant.durationMonths} bulan`
      : "—";

  return (
    <li className="rounded-xl border border-line bg-paper p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">
            {variant.label}
            {variant.isPromo && (
              <span className="stamp ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-900 dark:text-amber-100">
                Promo
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-ink/50">
            {durationLabel} · {formatIDR(variant.priceIDR)}
            {variant.priceMonthlyIDR
              ? ` · setara ${formatIDR(variant.priceMonthlyIDR)}/bln`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <details className="group">
            <summary className="cursor-pointer list-none rounded-lg border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink hover:bg-sand/60 [&::-webkit-details-marker]:hidden">
              Edit
            </summary>
            <div className="mt-3 rounded-xl border border-line bg-sand/20 p-4">
              <VariantForm productId={productId} variant={variant} />
            </div>
          </details>
          <form action={formAction}>
            <input type="hidden" name="variantId" value={variant.id} />
            <PendingSubmitButton
              variant="ghost"
              size="sm"
              pendingLabel="…"
              className="rounded-lg px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
              onClick={(e) => {
                if (!window.confirm(`Hapus varian "${variant.label}"?`)) {
                  e.preventDefault();
                }
              }}
            >
              Hapus
            </PendingSubmitButton>
          </form>
        </div>
      </div>
      {state.message && (
        <p
          className={`mt-2 text-xs ${state.ok ? "text-emerald-700" : "text-rose-700"}`}
        >
          {state.message}
        </p>
      )}
    </li>
  );
}

function VariantForm({
  productId,
  variant,
}: {
  productId: string;
  variant?: ProductVariant;
}) {
  const isEdit = !!variant;
  const [state, formAction] = useActionState<ProductFormState, FormData>(
    isEdit ? updateVariantAction : createVariantAction,
    { ok: false },
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      {isEdit && <input type="hidden" name="variantId" value={variant!.id} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor={`vlabel-${isEdit ? variant!.id : "new"}`} className={labelCls}>
            Label *
          </label>
          <input
            id={`vlabel-${isEdit ? variant!.id : "new"}`}
            name="label"
            required
            defaultValue={variant?.label}
            className={`${inputCls} mt-1.5`}
            placeholder="1 Bulan"
          />
          {!state.ok && state.errors?.label?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.label[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor={`vdays-${isEdit ? variant!.id : "new"}`} className={labelCls}>
            Durasi hari
          </label>
          <input
            id={`vdays-${isEdit ? variant!.id : "new"}`}
            name="durationDays"
            type="number"
            min={1}
            defaultValue={variant?.durationDays ?? ""}
            className={`${inputCls} mt-1.5`}
          />
        </div>

        <div>
          <label htmlFor={`vmonths-${isEdit ? variant!.id : "new"}`} className={labelCls}>
            Durasi bulan
          </label>
          <input
            id={`vmonths-${isEdit ? variant!.id : "new"}`}
            name="durationMonths"
            type="number"
            min={1}
            defaultValue={variant?.durationMonths ?? ""}
            className={`${inputCls} mt-1.5`}
          />
          {!state.ok && state.errors?.durationDays?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.durationDays[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor={`vprice-${isEdit ? variant!.id : "new"}`} className={labelCls}>
            Harga (IDR) *
          </label>
          <input
            id={`vprice-${isEdit ? variant!.id : "new"}`}
            name="priceIDR"
            type="number"
            min={1}
            required
            defaultValue={variant?.priceIDR}
            className={`${inputCls} mt-1.5`}
          />
          {!state.ok && state.errors?.priceIDR?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.priceIDR[0]}</p>
          )}
        </div>

        <div>
          <label
            htmlFor={`vpriceMonthly-${isEdit ? variant!.id : "new"}`}
            className={labelCls}
          >
            Harga/bulan (IDR)
          </label>
          <input
            id={`vpriceMonthly-${isEdit ? variant!.id : "new"}`}
            name="priceMonthlyIDR"
            type="number"
            min={1}
            defaultValue={variant?.priceMonthlyIDR ?? ""}
            className={`${inputCls} mt-1.5`}
          />
          {!state.ok && state.errors?.priceMonthlyIDR?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.priceMonthlyIDR[0]}</p>
          )}
        </div>

        <div className="flex items-end gap-4 pb-2 sm:col-span-2 lg:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              name="isPromo"
              defaultChecked={variant?.isPromo ?? false}
              className={checkCls}
            />
            Promo
          </label>
          <label htmlFor={`vsort-${isEdit ? variant!.id : "new"}`} className="flex items-center gap-2 text-sm font-medium text-ink">
            Urutan
            <input
              id={`vsort-${isEdit ? variant!.id : "new"}`}
              name="sortOrder"
              type="number"
              defaultValue={variant?.sortOrder ?? 1}
              className={`${inputCls} !w-20`}
            />
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <PendingSubmitButton size="sm" pendingLabel="Menyimpan…">
          {isEdit ? "Simpan varian" : "Tambah varian"}
        </PendingSubmitButton>
        {!state.ok && state.message && (
          <p className="text-xs text-rose-700">{state.message}</p>
        )}
        {state.ok && state.message && (
          <p className="text-xs text-emerald-700">{state.message}</p>
        )}
      </div>
    </form>
  );
}

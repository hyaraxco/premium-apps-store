"use client";

import { useActionState, useState } from "react";
import { createProductAction } from "./actions";
import {
  BADGE_OVERRIDES,
  BADGE_OVERRIDE_LABELS,
  slugify,
  type ProductFormState,
} from "@/lib/product-forms";
import { PendingSubmitButton } from "@/components/pending-submit-button";

type Props = {
  categories: { value: string; label: string }[];
};

const labelCls = "block text-sm font-medium text-ink";
const inputCls =
  "w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50";
const checkCls = "h-4 w-4 rounded border-line bg-paper accent-ink";

export function ProductCreateForm({ categories }: Props) {
  const [state, formAction] = useActionState<ProductFormState, FormData>(
    createProductAction,
    { ok: false },
  );
  const [autoSlug, setAutoSlug] = useState(true);
  const [slug, setSlug] = useState("");

  return (
    <form action={formAction} className="space-y-6">
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
          <label htmlFor="pname" className={labelCls}>
            Nama produk *
          </label>
          <input
            id="pname"
            name="name"
            required
            onChange={(e) => {
              if (autoSlug) setSlug(slugify(e.target.value));
            }}
            className={`${inputCls} mt-1.5`}
            placeholder="Contoh: Spotify Premium Family"
          />
          {!state.ok && state.errors?.name?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="pslug" className={labelCls}>
            Slug
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id="pslug"
              name="slug"
              value={slug}
              disabled={autoSlug}
              onChange={(e) => {
                setSlug(e.target.value);
                setAutoSlug(false);
              }}
              placeholder={autoSlug ? "otomatis dari nama" : "contoh: spotify-premium"}
              className={inputCls}
            />
            <label className="flex shrink-0 items-center gap-1.5 text-xs text-ink/60">
              <input
                type="checkbox"
                name="autoSlug"
                checked={autoSlug}
                onChange={(e) => {
                  setAutoSlug(e.target.checked);
                  if (e.target.checked) setSlug("");
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
          <label htmlFor="pcategory" className={labelCls}>
            Kategori *
          </label>
          <select
            id="pcategory"
            name="category"
            defaultValue="media"
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
          <label htmlFor="pfulfillment" className={labelCls}>
            Fulfillment *
          </label>
          <select
            id="pfulfillment"
            name="fulfillmentType"
            defaultValue="invite"
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
          <label htmlFor="picon" className={labelCls}>
            Ikon (1–2 karakter) *
          </label>
          <input
            id="picon"
            name="icon"
            maxLength={2}
            defaultValue="P"
            className={`${inputCls} mt-1.5`}
          />
          {!state.ok && state.errors?.icon?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.icon[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="paccent" className={labelCls}>
            Warna aksen (hex) *
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id="paccent"
              name="accent"
              type="color"
              defaultValue="#10A37F"
              className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-paper p-1"
            />
            <input
              name="accentText"
              type="text"
              defaultValue="#10A37F"
              onChange={(e) => {
                const v = e.target.value.trim();
                if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                  const color = document.getElementById("paccent") as HTMLInputElement | null;
                  if (color) color.value = v;
                }
              }}
              className={inputCls}
              placeholder="#10A37F"
            />
          </div>
          {!state.ok && state.errors?.accent?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.accent[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="psort" className={labelCls}>
            Urutan tampil
          </label>
          <input
            id="psort"
            name="sortOrder"
            type="number"
            defaultValue={0}
            className={`${inputCls} mt-1.5`}
          />
          {!state.ok && state.errors?.sortOrder?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.sortOrder[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="pbadge" className={labelCls}>
            Badge override
          </label>
          <select id="pbadge" name="badge" defaultValue="" className={`${inputCls} mt-1.5`}>
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
              defaultChecked
              className={checkCls}
            />
            Tayang di katalog
          </label>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="pdesc" className={labelCls}>
            Deskripsi singkat *
          </label>
          <textarea
            id="pdesc"
            name="description"
            required
            rows={2}
            className={`${inputCls} mt-1.5 resize-y`}
            placeholder="Satu kalimat tentang produk."
          />
          {!state.ok && state.errors?.description?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.description[0]}</p>
          )}
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="plongdesc" className={labelCls}>
            Deskripsi panjang *
          </label>
          <textarea
            id="plongdesc"
            name="longDescription"
            required
            rows={3}
            className={`${inputCls} mt-1.5 resize-y`}
            placeholder="Penjelasan detail yang tampil di halaman produk."
          />
          {!state.ok && state.errors?.longDescription?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.longDescription[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="psk" className={labelCls}>
            Syarat &amp; Ketentuan
          </label>
          <textarea
            id="psk"
            name="sk"
            rows={3}
            className={`${inputCls} mt-1.5 resize-y`}
            placeholder="Opsional — S&K produk."
          />
          {!state.ok && state.errors?.sk?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.sk[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="pgaransi" className={labelCls}>
            Ketentuan garansi
          </label>
          <textarea
            id="pgaransi"
            name="garansi"
            rows={3}
            className={`${inputCls} mt-1.5 resize-y`}
            placeholder="Opsional — info garansi produk."
          />
          {!state.ok && state.errors?.garansi?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.garansi[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="pstock" className={labelCls}>
            Stok pool awal
          </label>
          <input
            id="pstock"
            name="initialStock"
            type="number"
            min={0}
            defaultValue={0}
            className={`${inputCls} mt-1.5`}
          />
        </div>
      </fieldset>

      <fieldset className="grid gap-4 rounded-xl border border-line bg-sand/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="stamp px-1 text-ink/45">Varian pertama (opsional)</legend>

        <div className="sm:col-span-2 lg:col-span-4">
          <label htmlFor="vlabel" className={labelCls}>
            Label varian
          </label>
          <input
            id="vlabel"
            name="variantLabel"
            className={`${inputCls} mt-1.5`}
            placeholder="Kosongkan jika belum punya varian"
          />
          {!state.ok && state.errors?.variantLabel?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.variantLabel[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="vdays" className={labelCls}>
            Durasi hari
          </label>
          <input
            id="vdays"
            name="variantDurationDays"
            type="number"
            min={1}
            className={`${inputCls} mt-1.5`}
            placeholder="contoh: 7"
          />
          {!state.ok && state.errors?.variantDurationDays?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.variantDurationDays[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="vmonths" className={labelCls}>
            Durasi bulan
          </label>
          <input
            id="vmonths"
            name="variantDurationMonths"
            type="number"
            min={1}
            className={`${inputCls} mt-1.5`}
            placeholder="contoh: 1"
          />
          {!state.ok && state.errors?.variantDurationMonths?.[0] && (
            <p className="mt-1 text-xs text-rose-700">
              {state.errors.variantDurationMonths[0]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="vprice" className={labelCls}>
            Harga (IDR) *
          </label>
          <input
            id="vprice"
            name="variantPriceIDR"
            type="number"
            min={1}
            className={`${inputCls} mt-1.5`}
            placeholder="contoh: 15000"
          />
          {!state.ok && state.errors?.variantPriceIDR?.[0] && (
            <p className="mt-1 text-xs text-rose-700">{state.errors.variantPriceIDR[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="vpriceMonthly" className={labelCls}>
            Harga per bulan (IDR)
          </label>
          <input
            id="vpriceMonthly"
            name="variantPriceMonthlyIDR"
            type="number"
            min={1}
            className={`${inputCls} mt-1.5`}
            placeholder="opsional"
          />
          {!state.ok && state.errors?.variantPriceMonthlyIDR?.[0] && (
            <p className="mt-1 text-xs text-rose-700">
              {state.errors.variantPriceMonthlyIDR[0]}
            </p>
          )}
        </div>

        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" name="variantIsPromo" className={checkCls} />
            Promo
          </label>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <PendingSubmitButton pendingLabel="Menyimpan…" className="w-full sm:w-auto">
          Simpan produk
        </PendingSubmitButton>
        <p className="stamp text-ink/40">Butuh minimal nama + kategori + deskripsi</p>
      </div>
    </form>
  );
}

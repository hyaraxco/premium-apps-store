"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/types/product";
import { formatIDR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { StatusMeta } from "@/components/status-meta";

export function PDPVariantSelector({ product }: { product: Product }) {
  const { addItem } = useCart();
  const variants = product.variants || [];

  const isFamilyMonthly = variants.some((v) => v.durationMonths === 1 && v.priceMonthlyIDR);

  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?.id || ""
  );
  // T1.3 Qty stepper on PDP
  const [qty, setQty] = useState<number>(1);
  const [added, setAdded] = useState(false);

  const monthlyVariant = variants.find((v) => v.durationMonths === 1) || variants[0];
  const promoVariant = variants.find((v) => v.durationMonths === 12 && v.isPromo);

  const baseMonthlyPrice = monthlyVariant?.priceMonthlyIDR || monthlyVariant?.priceIDR || 0;
  
  let calculatedPrice = baseMonthlyPrice * selectedMonths;
  let isPromoApplied = false;

  if (selectedMonths === 12 && promoVariant) {
    calculatedPrice = promoVariant.priceIDR;
    isPromoApplied = true;
  }

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];
  const unitPrice = isFamilyMonthly ? calculatedPrice : selectedVariant?.priceIDR || 0;
  const finalPrice = unitPrice * qty;
  const currentStock = isFamilyMonthly ? (promoVariant?.stock ?? monthlyVariant?.stock ?? product.totalStock) : (selectedVariant?.stock ?? 0);

  const handleAddToCart = () => {
    if (isFamilyMonthly) {
      const activeVariant = selectedMonths === 12 && promoVariant ? promoVariant : monthlyVariant;
      addItem(product.id, activeVariant?.id, qty, selectedMonths);
    } else {
      addItem(product.id, selectedVariantId, qty, selectedVariant?.durationMonths || 1);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    // reset qty
    setQty(1);
  };

  return (
    <div className="p-4 sm:p-5">
      <p className="stamp text-ink/40">Harga lisensi · IDR</p>

      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[1.75rem] font-semibold tabular-nums tracking-tight text-ink">
          {formatIDR(finalPrice)}
        </span>
        {isFamilyMonthly && (
          <span className="text-sm text-ink/55">
            {selectedMonths === 12 && isPromoApplied
              ? `untuk 12 bulan × ${qty}`
              : `untuk ${selectedMonths} bulan × ${qty}`}
          </span>
        )}
      </div>

      {isFamilyMonthly && (
        <div className="mt-4 space-y-2 rounded-lg border border-line bg-sand/30 p-3">
          <p className="stamp text-ink/50">Pilih Durasi (Bulan)</p>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-md border border-line bg-paper">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center text-ink/70 hover:bg-sand disabled:opacity-30"
                onClick={() => setSelectedMonths((m) => Math.max(1, m - 1))}
                disabled={selectedMonths <= 1}
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums">
                {selectedMonths}m
              </span>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center text-ink/70 hover:bg-sand disabled:opacity-30"
                onClick={() => setSelectedMonths((m) => Math.min(12, m + 1))}
                disabled={selectedMonths >= 12}
              >
                +
              </button>
            </div>
            {promoVariant && (
              <button
                type="button"
                className={`stamp rounded border px-2 py-1.5 text-xs transition ${
                  selectedMonths === 12
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-paper text-ink/70 hover:border-ink/40"
                }`}
                onClick={() => setSelectedMonths(12)}
              >
                🎁 Promo 12m
              </button>
            )}
          </div>
        </div>
      )}

      {!isFamilyMonthly && variants.length > 1 && (
        <div className="mt-4 space-y-2 rounded-lg border border-line bg-sand/30 p-3">
          <fieldset>
            <legend className="stamp text-ink/50 mb-2">Pilih Varian / Durasi</legend>
            <div className="space-y-1.5">
              {variants.map((v) => (
                <label
                  key={v.id}
                  className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition ${
                    selectedVariantId === v.id
                      ? "border-ink bg-paper font-semibold"
                      : "border-line bg-paper/60 text-ink/70 hover:border-ink/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="pdp-variant"
                      value={v.id}
                      checked={selectedVariantId === v.id}
                      onChange={() => setSelectedVariantId(v.id)}
                      className="accent-ink"
                    />
                    <span>{v.label}</span>
                  </div>
                  <span className="tabular-nums font-medium">
                    {formatIDR(v.priceIDR)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-lg border border-line bg-sand/30 p-3">
        <label htmlFor="pdp-qty" className="stamp text-ink/50 cursor-pointer">
          Kuantitas (Unit)
        </label>
        <div className="inline-flex items-center rounded-md border border-line bg-paper">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center text-ink/70 hover:bg-sand disabled:opacity-30"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Kurangi kuantitas"
          >
            −
          </button>
          <span id="pdp-qty" className="w-8 text-center text-sm font-semibold tabular-nums">
            {qty}
          </span>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center text-ink/70 hover:bg-sand disabled:opacity-30"
            onClick={() => setQty((q) => Math.min(10, q + 1))}
            disabled={qty >= 10 || qty >= currentStock}
            aria-label="Tambah kuantitas"
          >
            +
          </button>
        </div>
      </div>

      <dl className="mt-4 space-y-2 rounded-lg border border-line bg-sand/30 px-3 py-2.5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <dt className="stamp text-ink/45">Stok</dt>
          <dd>
            <StatusMeta status={product.status} className="justify-end" />
          </dd>
        </div>
        <div className="flex justify-between gap-3 text-sm">
          <dt className="stamp text-ink/45">Tersedia</dt>
          <dd className="font-medium text-ink tabular-nums">
            {currentStock} unit
          </dd>
        </div>
        <div className="flex justify-between gap-3 text-sm">
          <dt className="stamp text-ink/45">Estimasi</dt>
          <dd className="max-w-[62%] text-right font-medium leading-snug text-ink">
            {product.delivery}
          </dd>
        </div>
      </dl>

      <div className="mt-4 space-y-2">
        <Button
          size="lg"
          className="w-full"
          disabled={currentStock <= 0}
          onClick={handleAddToCart}
        >
          {added ? "✓ Berhasil ditambahkan!" : "Tambah ke keranjang"}
        </Button>
        <Link
          href="/keranjang"
          transitionTypes={["nav-forward"]}
          className="flex h-10 w-full items-center justify-center rounded-lg border border-line text-sm font-medium text-ink transition hover:bg-sand/40"
        >
          Lihat keranjang
        </Link>
      </div>

      <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink/45">
        Aktivasi {product.fulfillmentType === "invite" ? "via Invite Link" : "via Username/Password Private"} · Garansi {product.garansi || "Terjamin"}
      </p>
    </div>
  );
}

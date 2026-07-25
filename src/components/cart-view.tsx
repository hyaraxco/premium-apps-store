"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { getProductById } from "@/lib/products";
import { formatIDR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { StatusMeta } from "@/components/status-meta";

export function CartView() {
  const { items, subtotal, setQuantity, removeItem, hydrated } = useCart();

  if (!hydrated) {
    return (
      <div
        className="surface p-8 text-sm text-ink/50"
        role="status"
        aria-live="polite"
      >
        Memuat keranjang…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-line bg-sand/25 px-6 py-12 text-center sm:py-14 rounded-[var(--radius-xl)]">
        <p className="stamp text-ink/40">Keranjang · kosong</p>
        <p className="mt-2 text-lg font-semibold tracking-tight text-ink">
          Belum ada lisensi
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink/60">
          Tambah app dari katalog. Item tersimpan di browser ini (localStorage)
          sampai checkout atau dibersihkan.
        </p>
        <Link
          href="/katalog"
          transitionTypes={["nav-back"]}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-ink px-5 text-sm font-medium text-paper hover:bg-ink/90"
        >
          Jelajahi katalog
        </Link>
      </div>
    );
  }

  const lineCount = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:gap-8">
      <div>
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <p className="stamp text-ink/40">
            {items.length} SKU · {lineCount} seat
          </p>
        </div>
        <ul
          className="divide-y divide-line border border-line bg-paper rounded-[var(--radius-xl)]"
          aria-label="Item keranjang"
        >
          {items.map((item) => {
            const product = getProductById(item.productId);
            if (!product) return null;

            const itemMonths = item.months || 1;
            const unitPrice =
              (product.minPriceIDR || product.price || 0) * itemMonths;
            const itemTotal = unitPrice * item.quantity;

            return (
              <li
                key={`${item.productId}-${item.variantId}`}
                className="flex flex-col gap-3 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4"
              >
                <div className="flex min-w-0 flex-1 gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-semibold text-white"
                    style={{ backgroundColor: product.accent }}
                    aria-hidden
                  >
                    {product.icon}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/apps/${product.slug}`}
                      transitionTypes={["nav-forward"]}
                      className="block truncate text-[15px] font-semibold leading-snug text-ink hover:underline"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-0.5 text-sm tabular-nums text-ink/55">
                      {formatIDR(unitPrice)}
                      <span className="text-ink/40">
                        {" "}
                        ({itemMonths} bulan)
                      </span>
                    </p>
                    <StatusMeta
                      status={product.status}
                      meta={product.delivery}
                      className="mt-0.5"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-4">
                  <div className="inline-flex items-center rounded-md border border-line bg-sand/20">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center text-ink/70 hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25"
                      onClick={() =>
                        setQuantity(
                          item.productId,
                          item.variantId,
                          item.quantity - 1
                        )
                      }
                      aria-label={`Kurangi ${product.name}`}
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm tabular-nums font-medium">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center text-ink/70 hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25"
                      onClick={() =>
                        setQuantity(
                          item.productId,
                          item.variantId,
                          item.quantity + 1
                        )
                      }
                      aria-label={`Tambah ${product.name}`}
                    >
                      +
                    </button>
                  </div>
                  <div className="min-w-[5.25rem] text-right">
                    <p className="text-sm font-semibold tabular-nums tracking-tight text-ink">
                      {formatIDR(itemTotal)}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        removeItem(item.productId, item.variantId)
                      }
                      className="mt-0.5 text-xs text-ink/40 hover:text-rose-700"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="surface h-fit p-4 sm:p-5">
        <p className="stamp text-ink/40">Ringkasan order</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between text-ink/65">
            <dt>Subtotal ({lineCount} seat)</dt>
            <dd className="tabular-nums font-medium text-ink">
              {formatIDR(subtotal)}
            </dd>
          </div>
          <div className="flex justify-between text-ink/65">
            <dt>Aktivasi digital</dt>
            <dd className="font-medium text-emerald-800 dark:text-emerald-300">
              Gratis
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2.5 text-base font-semibold text-ink">
            <dt>Total</dt>
            <dd className="font-semibold tabular-nums tracking-tight text-ink">
              {formatIDR(subtotal)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-ink/50">
          Setelah bayar (demo), instruksi aktivasi ke email. Estimasi 5 menit –
          3 jam tergantung produk.
        </p>
        <Link
          href="/checkout"
          transitionTypes={["nav-forward"]}
          className="mt-4 block"
        >
          <Button className="w-full" size="lg">
            Lanjut checkout
          </Button>
        </Link>
        <Link
          href="/katalog"
          transitionTypes={["nav-back"]}
          className="mt-2.5 block text-center text-sm text-ink/55 hover:text-ink"
        >
          Tambah lisensi lain
        </Link>
      </aside>
    </div>
  );
}

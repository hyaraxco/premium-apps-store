import type { Metadata } from "next";
import { getProductsFromDb } from "@/db/queries";
import { formatIDR } from "@/lib/format";
import {
  toggleProductActiveAction,
  updatePoolStockAction,
} from "./actions";
import { AdminFlash } from "@/components/admin-flash";
import { PendingSubmitButton } from "@/components/pending-submit-button";

export const metadata: Metadata = {
  title: "Admin Produk & Stok",
  description: "Kelola produk katalog, pool stok, dan status aktif Hyarax Apps.",
};

export default async function AdminProdukPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; msg?: string }>;
}) {
  const sp = await searchParams;
  const allProducts = await getProductsFromDb();

  return (
    <div className="space-y-6">
      <AdminFlash searchParams={sp} clearHref="/admin/produk" />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Produk &amp; Stok
          </h1>
          <p className="text-xs text-ink/60">
            {allProducts.length} produk · stok dari inventory pool (bukan sum
            varian)
          </p>
        </div>
      </div>

      {allProducts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-ink/60">
          Belum ada produk di database. Jalankan seed.
        </div>
      ) : (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-sand/30 stamp text-ink/45">
                <tr>
                  <th className="px-4 py-3 font-normal">Produk</th>
                  <th className="px-4 py-3 font-normal">Fulfillment</th>
                  <th className="px-4 py-3 font-normal">Harga mulai</th>
                  <th className="px-4 py-3 font-normal">Pool stok</th>
                  <th className="px-4 py-3 font-normal">Status</th>
                  <th className="px-4 py-3 font-normal text-right">Katalog</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {allProducts.map((p) => (
                  <tr key={p.id} className="transition hover:bg-sand/20">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
                          style={{ backgroundColor: p.accent }}
                        >
                          {p.icon}
                        </span>
                        <div>
                          <p className="font-semibold text-ink">{p.name}</p>
                          <p className="text-xs text-ink/50">{p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="stamp rounded border border-line bg-paper px-2 py-0.5 text-[11px]">
                        {p.fulfillmentType === "invite"
                          ? "Invite link"
                          : "Credential"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold tabular-nums text-ink">
                      {formatIDR(p.minPriceIDR)}
                    </td>
                    <td className="px-4 py-3.5 space-y-1">
                      <form
                        action={updatePoolStockAction}
                        className="inline-flex flex-wrap items-center gap-2"
                      >
                        <input type="hidden" name="productId" value={p.id} />
                        <input
                          type="number"
                          name="stock"
                          min={0}
                          defaultValue={p.totalStock}
                          className="w-16 rounded border border-line px-2 py-1 text-xs text-ink"
                          aria-label={`Stok pool ${p.name}`}
                        />
                        <PendingSubmitButton
                          size="sm"
                          pendingLabel="…"
                          className="h-8 px-2 text-[11px]"
                        >
                          Set
                        </PendingSubmitButton>
                      </form>
                      <div className="mt-2 space-y-0.5 border-l-2 border-line/60 pl-2 text-[11px] text-ink/50">
                        {p.variants.map((v) => (
                          <div key={v.id}>· {v.label}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`stamp rounded px-2 py-0.5 text-[11px] ${
                          p.totalStock > 0
                            ? "bg-sand text-ink"
                            : "bg-rose-500/15 text-rose-900 dark:text-rose-200"
                        }`}
                      >
                        {p.totalStock > 0 ? "Tersedia" : "Habis"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <form action={toggleProductActiveAction}>
                        <input type="hidden" name="productId" value={p.id} />
                        <input
                          type="hidden"
                          name="currentActive"
                          value={p.isActive ? "true" : "false"}
                        />
                        <PendingSubmitButton
                          type="submit"
                          variant="ghost"
                          size="sm"
                          pendingLabel="…"
                          className={
                            p.isActive
                              ? "text-rose-600 hover:text-rose-700"
                              : "text-emerald-700 hover:text-emerald-800"
                          }
                        >
                          {p.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </PendingSubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

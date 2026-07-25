import type { Metadata } from "next";
import { getProductsFromDb } from "@/db/queries";
import { formatIDR } from "@/lib/format";
import { toggleProductActiveAction, updateVariantStockAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin Produk & Stok",
  description: "Kelola 9 produk real, varian, dan stok di Stackbay.",
};

export default async function AdminProdukPage() {
  const allProducts = await getProductsFromDb();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Produk &amp; Stok
          </h1>
          <p className="text-xs text-ink/60">
            Total {allProducts.length} produk terdaftar dari katalog.
          </p>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-sand/30 stamp text-ink/45">
              <tr>
                <th className="px-4 py-3 font-normal">Produk</th>
                <th className="px-4 py-3 font-normal">Fulfillment</th>
                <th className="px-4 py-3 font-normal">Harga Mulai</th>
                <th className="px-4 py-3 font-normal">Varian &amp; Stok</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {allProducts.map((p) => (
                <tr key={p.id} className="hover:bg-sand/20 transition">
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
                      {p.fulfillmentType === "invite" ? "Invite Link" : "Credential"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold tabular-nums text-ink">
                    {formatIDR(p.minPriceIDR)}
                  </td>
                  <td className="px-4 py-3.5 space-y-1">
                    {p.variants.map((v) => (
                      <div key={v.id} className="flex items-center gap-2 text-xs">
                        <span className="font-medium text-ink/75">{v.label}:</span>
                        <span className="font-semibold tabular-nums text-ink">
                          {v.stock} unit
                        </span>
                        <form
                          action={async (formData) => {
                            "use server";
                            const stock = parseInt(String(formData.get("stock") ?? "0"), 10);
                            await updateVariantStockAction(v.id, stock);
                          }}
                          className="inline-flex items-center gap-1"
                        >
                          <input
                            type="number"
                            name="stock"
                            defaultValue={v.stock}
                            className="w-14 rounded border border-line px-1.5 py-0.5 text-xs text-ink"
                          />
                          <button
                            type="submit"
                            className="rounded bg-ink px-1.5 py-0.5 text-[10px] text-paper font-semibold hover:bg-ink/90"
                          >
                            Set
                          </button>
                        </form>
                      </div>
                    ))}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`stamp rounded px-2 py-0.5 text-[11px] ${
                        p.totalStock > 0
                          ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200"
                          : "bg-rose-500/15 text-rose-900 dark:text-rose-200"
                      }`}
                    >
                      {p.totalStock > 0 ? `Stok ${p.totalStock}` : "Habis"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <form
                      action={toggleProductActiveAction.bind(
                        null,
                        p.id,
                        p.isActive
                      )}
                    >
                      <button
                        type="submit"
                        className={`text-xs font-medium hover:underline ${
                          p.isActive ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {p.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

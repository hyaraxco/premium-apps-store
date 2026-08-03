import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getProductsFromDb } from "@/db/queries";
import { formatIDR } from "@/lib/format";
import { AdminFlash } from "@/components/admin-flash";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { cn } from "@/lib/utils";
import { DebouncedSearch } from "@/components/debounced-search";
import { FilterDropdown } from "@/components/filter-dropdown";
import { toggleProductActiveAction, updatePoolStockAction } from "./actions";

export const metadata: Metadata = {
  title: "Admin Produk & Stok",
  description: "Kelola produk, stok, dan status tayang Hyarax Apps.",
};
 
const STATUS_TABS = [
  { id: "all", label: "Semua" },
  { id: "active", label: "Aktif" },
  { id: "inactive", label: "Nonaktif" },
] as const;

export default async function AdminProdukPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string; msg?: string; q?: string; status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const query = (sp.q ?? "").trim().toLowerCase();
  const statusFilter = sp.status || "all";
  
   const rawProducts = await getProductsFromDb({ includeInactive: true });
   const filteredByStatus = statusFilter === "all"
     ? rawProducts
     : statusFilter === "active"
       ? rawProducts.filter((p) => p.isActive)
       : rawProducts.filter((p) => !p.isActive);

   const allProducts = query
     ? filteredByStatus.filter((p) => [p.name, p.id, p.category].join(" ").toLowerCase().includes(query))
     : filteredByStatus;

  const inStock = rawProducts.filter((p) => p.totalStock > 0).length;
  const lowStock = rawProducts.filter((p) => p.totalStock > 0 && p.totalStock <= 5).length;
  const outOfStock = rawProducts.filter((p) => p.totalStock === 0).length;
  const activeCount = rawProducts.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6 lg:space-y-8">
      <AdminFlash searchParams={sp} clearHref="/admin/produk" />

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink/55">
        <Link href="/admin" className="hover:text-ink">
          Admin
        </Link>
        <span>/</span>
        <span className="text-ink/80">Produk & Stok</span>
      </div>

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-paper p-5 sm:p-6 border-b border-line">
          <div>
            <p className="stamp text-ink/45">Operasional katalog</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              Produk & stok
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-ink/60">
              Atur status tayang, stok pool, dan varian produk.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/admin/order?pay=pending" className="rounded-xl border border-line bg-sand/20 px-3.5 py-2 text-ink hover:bg-sand/60">
              Cek order pending
            </Link>
            <Link href="/admin/pengaturan" className="rounded-xl bg-ink px-3.5 py-2 font-medium text-paper hover:opacity-90">
              Buka pengaturan
            </Link>
          </div>
        </div>

        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Produk aktif" value={String(activeCount)} hint="Sedang tayang di toko" tone="ok" />
          <Metric label="Ready stock" value={String(inStock)} hint="Stok tersedia" />
          <Metric label="Low stock" value={String(lowStock)} hint="Stok menipis (1–5)" tone="warn" />
          <Metric label="Out of stock" value={String(outOfStock)} hint="Stok habis" tone="danger" />
        </div>
      </section>

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-ink">Daftar produk</h2>
            <p className="stamp text-ink/45">Stok dari pool tiap produk</p>
          </div>
           <div className="flex items-center gap-3">
             <FilterDropdown
               name="status"
               ariaLabel="Filter status produk"
               options={STATUS_TABS.map((t) => ({ value: t.id, label: t.label }))}
               defaultValue={statusFilter}
             />
             <DebouncedSearch placeholder="Cari ID/Nama produk..." defaultValue={query} />
             <p className="stamp text-ink/45">{allProducts.length} produk</p>
           </div>
        </div>

        {allProducts.length === 0 ? (
          <div className="px-5 py-10 text-center sm:px-6">
            <p className="stamp text-ink/40">Kosong</p>
            <p className="mt-1 text-sm text-ink/60">Tidak ada produk yang cocok atau database kosong.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand/35 text-ink/45">
                <tr className="stamp">
                  <th className="px-5 py-3 font-normal w-12 text-center">No</th>
                  <th className="px-5 py-3 font-normal">Produk</th>
                  <th className="px-5 py-3 font-normal">Fulfillment</th>
                  <th className="px-5 py-3 font-normal">Harga mulai</th>
                  <th className="px-5 py-3 font-normal">Pool stok</th>
                  <th className="px-5 py-3 font-normal">Status</th>
                  <th className="px-5 py-3 font-normal text-right">Katalog</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {allProducts.map((p, i) => (
                  <tr key={p.id} className={cn("transition hover:bg-sand/20", !p.isActive && "opacity-65 bg-sand/15")}>
                    <td className="px-5 py-4 text-center text-xs text-ink/50">{i + 1}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: p.accent }}>
                          {p.icon}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-ink">{p.name}</p>
                            {!p.isActive && (
                              <span className="stamp rounded-full bg-sand-deep/60 px-2 py-0.5 text-[10px] text-ink/70">
                                Nonaktif
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink/50">{p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="stamp rounded-full border border-line bg-paper px-2.5 py-1 text-[11px]">
                        {p.fulfillmentType === "invite" ? "Invite link" : "Credential"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold tabular-nums text-ink">{formatIDR(p.minPriceIDR)}</td>
                    <td className="px-5 py-4 align-top">
                      <div className="space-y-2">
                        <form action={updatePoolStockAction} className="inline-flex flex-wrap items-center gap-2">
                          <input type="hidden" name="productId" value={p.id} />
                          <input
                            type="number"
                            name="stock"
                            min={0}
                            defaultValue={p.totalStock}
                            className="w-20 rounded-xl border border-line bg-paper px-3 py-2 text-xs text-ink"
                            aria-label={`Stok pool ${p.name}`}
                          />
                          <PendingSubmitButton size="sm" pendingLabel="…" className="h-9 px-3 text-[11px]">
                            Set
                          </PendingSubmitButton>
                        </form>
                        <div className="space-y-1 border-l-2 border-line/60 pl-3 text-[11px] text-ink/50">
                          {p.variants.map((v) => (
                            <div key={v.id}>· {v.label}</div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`stamp rounded-full px-2.5 py-1 text-[11px] ${
                          p.totalStock > 5
                            ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                            : p.totalStock > 0
                              ? "bg-amber-500/12 text-amber-900 dark:text-amber-100"
                              : "bg-rose-500/12 text-rose-900 dark:text-rose-100"
                        }`}
                      >
                        {p.totalStock > 0 ? "Tersedia" : "Habis"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <form action={toggleProductActiveAction} className="inline-flex">
                        <input type="hidden" name="productId" value={p.id} />
                        <input type="hidden" name="currentActive" value={p.isActive ? "true" : "false"} />
                        <PendingSubmitButton
                          type="submit"
                          variant="ghost"
                          size="sm"
                          pendingLabel="…"
                          className={cn(
                            "rounded-xl px-3.5 py-2",
                            p.isActive
                              ? "text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                              : "bg-emerald-500/15 font-semibold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/25",
                          )}
                        >
                          {p.isActive ? "Nonaktifkan" : "Aktifkan Kembali"}
                        </PendingSubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "ok" | "warn" | "danger";
}) {
  return (
    <div className="bg-paper p-5 sm:p-6">
      <p className="stamp text-ink/45">{label}</p>
      <p
        className={cn(
          "mt-3 text-3xl font-semibold tracking-tight text-ink",
          tone === "ok" && "text-emerald-700",
          tone === "warn" && "text-amber-700",
          tone === "danger" && "text-rose-700",
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-sm text-ink/55">{hint}</p>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq, or, sql } from "drizzle-orm";
import { formatIDR } from "@/lib/format";
import { AdminFlash } from "@/components/admin-flash";
import { fulfillLabel, payLabel } from "@/lib/admin-flash";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Kelola pesanan & stok Hyarax Apps",
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [recentOrders, lowStock, revenueRows, totalRows] = await Promise.all([
    db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(5),
    db.select().from(schema.inventoryPools).where(eq(schema.inventoryPools.availableStock, 0)).limit(5),
    db
      .select({
        total: sql<number>`coalesce(sum(${schema.orders.totalIDR}), 0)`.mapWith(Number),
      })
      .from(schema.orders)
      .where(or(eq(schema.orders.paymentStatus, "paid"), eq(schema.orders.status, "paid"))),
    db.select({ count: sql<number>`count(*)` }).from(schema.orders),
  ]);

  const totalRevenue = revenueRows[0]?.total ?? 0;
  const totalCount = totalRows[0]?.count ?? 0;

  return (
    <div className="space-y-6 lg:space-y-8">
      <AdminFlash searchParams={{}} clearHref="/admin" />

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-paper p-5 sm:p-6 border-b border-line">
          <div>
            <p className="stamp text-ink/45">Ringkasan admin</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              Dashboard operasional
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-ink/60">
              Pantau order, stok, dan pengaturan toko dalam satu tempat.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/order" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-paper hover:opacity-90">
              Buka order
            </Link>
            <Link href="/admin/produk" className="rounded-xl border border-line bg-paper px-4 py-2 text-sm font-medium text-ink hover:bg-sand/60">
              Cek stok
            </Link>
          </div>
        </div>

        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Pesanan terbaru" value={String(recentOrders.length)} hint="5 pesanan terakhir" />
          <Metric label="Stok habis" value={String(lowStock.length)} hint="Produk tanpa stok tersedia" tone="warn" />
          <Metric label="Total revenue" value={formatIDR(totalRevenue)} hint="Pesanan lunas (paid)" tone="ok" />
          <Metric label="Total pesanan" value={String(totalCount)} hint="Seluruh pesanan tercatat" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-ink">Pesanan terbaru</h2>
              <p className="stamp text-ink/45">5 pesanan terakhir</p>
            </div>
            <Link href="/admin/order" className="text-sm text-ink/70 hover:text-ink">
              Semua
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand/35 text-ink/45">
                <tr className="stamp">
                  <th className="px-5 py-3 font-normal w-12 text-center">No</th>
                  <th className="px-5 py-3 font-normal">Order</th>
                  <th className="px-5 py-3 font-normal">Pembeli</th>
                  <th className="px-5 py-3 font-normal">Status</th>
                  <th className="px-5 py-3 font-normal text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentOrders.map((order, i) => (
                  <tr key={order.id} className="transition hover:bg-sand/20">
                    <td className="px-5 py-4 text-center text-xs text-ink/50">{i + 1}</td>
                    <td className="px-5 py-4 font-medium text-ink">
                      <Link href={`/admin/order/${order.id}`} className="hover:underline">
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink">{order.buyerName}</p>
                      <p className="text-xs text-ink/50">{order.buyerEmail}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span className={statusClass(order.paymentStatus, "pay")}>{payLabel(order.paymentStatus)}</span>
                        <span className={statusClass(order.fulfillmentStatus, "fulfill")}>{fulfillLabel(order.fulfillmentStatus)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-ink">{formatIDR(order.totalIDR)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink">Stok kritis</h2>
                <p className="stamp text-ink/45">Produk tanpa stok tersedia</p>
              </div>
              <Link href="/admin/produk" className="text-sm text-ink/70 hover:text-ink">
                Kelola
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {lowStock.length > 0 ? (
                lowStock.map((item) => (
                  <div key={item.id} className="rounded-xl border border-line bg-sand/25 p-3">
                    <p className="font-medium text-ink">{item.productId}</p>
                    <p className="stamp mt-1 text-rose-700">Stok 0</p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-line p-4 text-sm text-ink/60">
                  Tidak ada stok kritis.
                </div>
              )}
            </div>
          </div>

          <div className="surface-muted p-5 sm:p-6">
            <p className="stamp text-ink/45">Shortcut</p>
            <div className="mt-4 grid gap-2 text-sm">
              <Link href="/admin/order?pay=pending" className="rounded-xl border border-line bg-paper px-4 py-3 text-ink hover:bg-sand/60">
                Filter order pending
              </Link>
              <Link href="/admin/order?fulfill=pending" className="rounded-xl border border-line bg-paper px-4 py-3 text-ink hover:bg-sand/60">
                Filter belum dikirim
              </Link>
              <Link href="/admin/pengaturan" className="rounded-xl border border-line bg-paper px-4 py-3 text-ink hover:bg-sand/60">
                Buka pengaturan toko
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "ok" | "warn" }) {
  return (
    <div className="bg-paper p-5 sm:p-6">
      <p className="stamp text-ink/45">{label}</p>
      <div className={cn("mt-3 text-3xl font-semibold tracking-tight text-ink", tone === "ok" && "text-emerald-700", tone === "warn" && "text-amber-700")}>{value}</div>
      <p className="mt-2 text-sm text-ink/55">{hint}</p>
    </div>
  );
}

function statusClass(value: string | null | undefined, kind: "pay" | "fulfill") {
  const base = "stamp rounded-full border border-line px-2.5 py-1 text-[11px]";
  if (kind === "pay") {
    if (value === "pending") return `${base} bg-amber-500/12 text-amber-900 dark:text-amber-100`;
    if (value === "paid") return `${base} bg-emerald-500/10 text-emerald-900 dark:text-emerald-100`;
    if (value === "failed" || value === "cancelled") return `${base} bg-rose-500/12 text-rose-900 dark:text-rose-100`;
  }
  if (kind === "fulfill") {
    if (value === "fulfilled") return `${base} bg-emerald-500/10 text-emerald-900 dark:text-emerald-100`;
    if (value === "partial") return `${base} bg-amber-500/12 text-amber-900 dark:text-amber-100`;
    if (value === "pending") return `${base} bg-sand text-ink/70`;
  }
  return `${base} bg-paper text-ink/70`;
}

import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatIDR } from "@/lib/format";

export const metadata: Metadata = {
  title: "Admin Orders",
  description: "Kelola pesanan pelanggan Hyarax Apps.",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filterStatus } = await searchParams;

  let orderList: (typeof schema.orders.$inferSelect)[] = [];
  let loadError: string | null = null;

  if (process.env.DATABASE_URL) {
    try {
      const { expireUnpaidOrders } = await import("@/lib/orders/expire");
      await expireUnpaidOrders(20);
    } catch (e) {
      console.error("expireUnpaidOrders", e);
    }
  }

  if (!process.env.DATABASE_URL) {
    loadError = "DATABASE_URL belum diset — order admin tidak tersedia.";
  } else {
    try {
      if (filterStatus && filterStatus !== "all") {
        orderList = await db
          .select()
          .from(schema.orders)
          .where(eq(schema.orders.paymentStatus, filterStatus))
          .orderBy(desc(schema.orders.createdAt));
      } else {
        orderList = await db
          .select()
          .from(schema.orders)
          .orderBy(desc(schema.orders.createdAt));
      }
    } catch (e) {
      console.error(e);
      loadError = "Gagal memuat order dari database.";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Daftar Pesanan
          </h1>
          <p className="text-xs text-ink/60">
            Total {orderList.length} pesanan tercatat.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-paper p-1">
          {[
            { id: "all", label: "Semua" },
            { id: "pending", label: "Menunggu Bayar" },
            { id: "paid", label: "Diverifikasi" },
            { id: "fulfilled", label: "Selesai" },
          ].map((tab) => (
            <Link
              key={tab.id}
              href={tab.id === "all" ? "/admin/order" : `/admin/order?status=${tab.id}`}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                (filterStatus || "all") === tab.id
                  ? "bg-ink text-paper"
                  : "text-ink/65 hover:bg-sand/60"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-line bg-sand/40 px-4 py-3 text-sm text-ink/70">
          {loadError}
        </div>
      )}

      {!loadError && orderList.length === 0 && (
        <div className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-ink/60">
          Belum ada pesanan.
        </div>
      )}

      {/* Orders Table */}
      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-sand/30 stamp text-ink/45">
              <tr>
                <th className="px-4 py-3 font-normal">Order ID</th>
                <th className="px-4 py-3 font-normal">Pembeli</th>
                <th className="px-4 py-3 font-normal">Metode</th>
                <th className="px-4 py-3 font-normal">Total</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">Tanggal</th>
                <th className="px-4 py-3 font-normal text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orderList.map((ord) => {
                const statusKey = ord.paymentStatus || ord.status;
                const badgeColor = {
                  pending: "bg-sand text-ink/70",
                  paid: "bg-sand text-ink",
                  fulfilled: "bg-sand text-ink",
                  failed: "bg-rose-500/15 text-rose-900 dark:text-rose-200",
                  cancelled: "bg-sand text-ink/50",
                }[statusKey] || "bg-sand text-ink";

                return (
                  <tr key={ord.id} className="hover:bg-sand/20 transition">
                    <td className="px-4 py-3.5 font-semibold text-ink">
                      <Link href={`/admin/order/${ord.id}`} className="hover:underline">
                        {ord.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-ink">{ord.buyerName}</p>
                      <p className="text-xs text-ink/50">{ord.buyerEmail}</p>
                    </td>
                    <td className="px-4 py-3.5 uppercase text-xs font-semibold text-ink/70">
                      {ord.paymentMethod}
                    </td>
                    <td className="px-4 py-3.5 font-semibold tabular-nums text-ink">
                      {formatIDR(ord.totalIDR)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`stamp rounded border border-line px-2 py-0.5 text-[11px] ${badgeColor}`}>
                        {ord.paymentStatus || ord.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-ink/50">
                      {new Date(ord.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/order/${ord.id}`}
                        className="inline-flex items-center rounded-md border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:bg-sand"
                      >
                        Detail &amp; Akses
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatIDR } from "@/lib/format";

export const metadata: Metadata = {
  title: "Admin Orders",
  description: "Kelola pesanan pelanggan Stackbay.",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filterStatus } = await searchParams;

  let orderList: (typeof schema.orders.$inferSelect)[] = [];

  if (process.env.DATABASE_URL) {
    try {
      if (filterStatus && filterStatus !== "all") {
        orderList = await db
          .select()
          .from(schema.orders)
          .where(eq(schema.orders.status, filterStatus))
          .orderBy(desc(schema.orders.createdAt));
      } else {
        orderList = await db
          .select()
          .from(schema.orders)
          .orderBy(desc(schema.orders.createdAt));
      }
    } catch {
      // ignore
    }
  }

  // Mock data if database empty / not connected
  if (orderList.length === 0 && !filterStatus) {
    orderList = [
      {
        id: "SB-20260725-1001",
        buyerName: "Budi Santoso",
        buyerEmail: "budi@example.com",
        buyerWhatsapp: "081234567890",
        paymentMethod: "qris",
        totalIDR: 55000,
        status: "pending",
        paymentNote: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
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
                const statusBadge = {
                  pending: "bg-amber-500/15 text-amber-900 dark:text-amber-200",
                  paid: "bg-blue-500/15 text-blue-900 dark:text-blue-200",
                  fulfilled: "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200",
                  failed: "bg-rose-500/15 text-rose-900 dark:text-rose-200",
                }[ord.status] || "bg-sand text-ink";

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
                      <span className={`stamp rounded px-2 py-0.5 text-[11px] ${statusBadge}`}>
                        {ord.status}
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

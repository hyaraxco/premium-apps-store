import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { formatIDR } from "@/lib/format";
import { AdminFlash } from "@/components/admin-flash";
import { fulfillLabel, payLabel } from "@/lib/admin-flash";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Orders",
  description: "Kelola pesanan pelanggan Hyarax Apps.",
};

const PAY_TABS = [
  { id: "all", label: "Semua" },
  { id: "pending", label: "Menunggu bayar" },
  { id: "paid", label: "Lunas" },
] as const;

const FULFILL_TABS = [
  { id: "all", label: "Semua kirim" },
  { id: "pending", label: "Belum dikirim" },
  { id: "partial", label: "Sebagian" },
  { id: "fulfilled", label: "Selesai" },
] as const;

function hrefFor(pay: string, fulfill: string) {
  const sp = new URLSearchParams();
  if (pay && pay !== "all") sp.set("pay", pay);
  if (fulfill && fulfill !== "all") sp.set("fulfill", fulfill);
  const q = sp.toString();
  return q ? `/admin/order?${q}` : "/admin/order";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    pay?: string;
    fulfill?: string;
    flash?: string;
    msg?: string;
  }>;
}) {
  const sp = await searchParams;
  // Legacy ?status= → map to pay or fulfill
  let payFilter = sp.pay || "all";
  let fulfillFilter = sp.fulfill || "all";
  if (sp.status) {
    if (["pending", "paid", "failed", "cancelled", "refunded"].includes(sp.status)) {
      payFilter = sp.status;
    } else if (["partial", "fulfilled", "revoked"].includes(sp.status)) {
      fulfillFilter = sp.status;
    } else if (sp.status === "fulfilled") {
      fulfillFilter = "fulfilled";
    }
  }

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
      const conditions = [];
      if (payFilter !== "all") {
        conditions.push(eq(schema.orders.paymentStatus, payFilter));
      }
      if (fulfillFilter !== "all") {
        conditions.push(eq(schema.orders.fulfillmentStatus, fulfillFilter));
      }

      if (conditions.length > 0) {
        orderList = await db
          .select()
          .from(schema.orders)
          .where(and(...conditions))
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

  const clearFlash = hrefFor(payFilter, fulfillFilter);

  return (
    <div className="space-y-6">
      <AdminFlash searchParams={sp} clearHref={clearFlash} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Daftar Pesanan
          </h1>
          <p className="text-xs text-ink/60">
            {orderList.length} pesanan · filter bayar &amp; pengiriman terpisah
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="stamp text-ink/40">Status bayar</p>
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-paper p-1">
          {PAY_TABS.map((tab) => (
            <Link
              key={tab.id}
              href={hrefFor(tab.id, fulfillFilter)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition",
                payFilter === tab.id
                  ? "bg-ink text-paper"
                  : "text-ink/65 hover:bg-sand/60",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <p className="stamp text-ink/40 pt-1">Status pengiriman akses</p>
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-paper p-1">
          {FULFILL_TABS.map((tab) => (
            <Link
              key={tab.id}
              href={hrefFor(payFilter, tab.id)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition",
                fulfillFilter === tab.id
                  ? "bg-ink text-paper"
                  : "text-ink/65 hover:bg-sand/60",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-rose-600/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-950 dark:text-rose-100">
          {loadError}
        </div>
      )}

      {!loadError && orderList.length === 0 && (
        <div className="rounded-lg border border-dashed border-line px-4 py-10 text-center">
          <p className="stamp text-ink/40">Antrian kosong</p>
          <p className="mt-1 text-sm text-ink/60">
            Tidak ada pesanan untuk filter ini. Longgarkan filter atau tunggu checkout baru.
          </p>
        </div>
      )}

      {orderList.length > 0 && (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-sand/30 stamp text-ink/45">
                <tr>
                  <th className="px-4 py-3 font-normal">Order</th>
                  <th className="px-4 py-3 font-normal">Pembeli</th>
                  <th className="px-4 py-3 font-normal">Metode</th>
                  <th className="px-4 py-3 font-normal">Total</th>
                  <th className="px-4 py-3 font-normal">Bayar</th>
                  <th className="px-4 py-3 font-normal">Kirim</th>
                  <th className="px-4 py-3 font-normal">Tanggal</th>
                  <th className="px-4 py-3 font-normal text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orderList.map((ord) => {
                  const pay = ord.paymentStatus || ord.status;
                  const fulfill = ord.fulfillmentStatus || "pending";
                  return (
                    <tr key={ord.id} className="hover:bg-sand/20 transition">
                      <td className="px-4 py-3.5 font-semibold text-ink">
                        <Link
                          href={`/admin/order/${ord.id}`}
                          className="hover:underline"
                        >
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
                        <span
                          className={cn(
                            "stamp rounded border border-line px-2 py-0.5 text-[11px]",
                            pay === "pending" && "bg-amber-500/15 text-amber-950 dark:text-amber-100",
                            pay === "paid" && "bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
                            (pay === "failed" || pay === "cancelled") &&
                              "bg-rose-500/15 text-rose-900 dark:text-rose-200",
                          )}
                        >
                          {payLabel(pay)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "stamp rounded border border-line px-2 py-0.5 text-[11px]",
                            fulfill === "fulfilled" &&
                              "bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
                            fulfill === "partial" &&
                              "bg-amber-500/15 text-amber-950 dark:text-amber-100",
                            fulfill === "pending" && "bg-sand text-ink/70",
                          )}
                        >
                          {fulfillLabel(fulfill)}
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
                          {pay === "pending"
                            ? "Verifikasi"
                            : fulfill !== "fulfilled"
                              ? "Kirim akses"
                              : "Detail"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

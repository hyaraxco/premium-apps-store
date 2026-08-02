import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { AdminFlash } from "@/components/admin-flash";
import { formatIDR } from "@/lib/format";
import { fulfillLabel, payLabel } from "@/lib/admin-flash";
import { cn } from "@/lib/utils";
import { DebouncedSearch } from "@/components/debounced-search";
import { FilterDropdown } from "@/components/filter-dropdown";

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

function hrefFor(pay: string, fulfill: string, q = "") {
  const sp = new URLSearchParams();
  if (pay && pay !== "all") sp.set("pay", pay);
  if (fulfill && fulfill !== "all") sp.set("fulfill", fulfill);
  if (q) sp.set("q", q);
  const qs = sp.toString();
  return qs ? `/admin/order?${qs}` : "/admin/order";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    pay?: string;
    fulfill?: string;
    q?: string;
    flash?: string;
    msg?: string;
  }>;
}) {
  const sp = await searchParams;
  let payFilter = sp.pay || "all";
  let fulfillFilter = sp.fulfill || "all";
  const query = (sp.q ?? "").trim().toLowerCase();

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
      if (payFilter !== "all") conditions.push(eq(schema.orders.paymentStatus, payFilter));
      if (fulfillFilter !== "all") conditions.push(eq(schema.orders.fulfillmentStatus, fulfillFilter));

      const rows =
        conditions.length > 0
          ? await db.select().from(schema.orders).where(and(...conditions)).orderBy(desc(schema.orders.createdAt))
          : await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));

      orderList = query
        ? rows.filter((ord) => [ord.id, ord.buyerName, ord.buyerEmail].join(" ").toLowerCase().includes(query))
        : rows;
    } catch (e) {
      console.error(e);
      loadError = "Gagal memuat order dari database.";
    }
  }

  const totalRevenue = orderList.reduce((sum, ord) => sum + ord.totalIDR, 0);
  const pendingCount = orderList.filter((ord) => (ord.paymentStatus || ord.status) === "pending").length;
  const paidCount = orderList.filter((ord) => (ord.paymentStatus || ord.status) === "paid").length;
  const fulfillPendingCount = orderList.filter((ord) => (ord.fulfillmentStatus || "pending") === "pending").length;
  const clearFlash = hrefFor(payFilter, fulfillFilter);

  return (
    <div className="space-y-6 lg:space-y-8">
      <AdminFlash searchParams={sp} clearHref={clearFlash} />

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink/55">
        <Link href="/admin" className="hover:text-ink">
          Admin
        </Link>
        <span>/</span>
        <span className="text-ink/80">Orders</span>
      </div>

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-paper p-5 sm:p-6 border-b border-line">
          <div>
            <p className="stamp text-ink/45">Operasional pesanan</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              Daftar pesanan
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-ink/60">
              Filter status bayar dan pengiriman, atau cari ID dan email.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/admin/order/export?pay=${encodeURIComponent(payFilter)}&fulfill=${encodeURIComponent(fulfillFilter)}&q=${encodeURIComponent(query)}`}
              download
              className="rounded-xl border border-line bg-paper px-3.5 py-2 text-sm font-medium text-ink hover:bg-sand/60 inline-flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export CSV
            </a>
            <Link href="/admin/order" className="rounded-xl border border-line bg-sand/20 px-3.5 py-2 text-sm text-ink hover:bg-sand/60">
              Reset filter
            </Link>
            <Link href="/admin/order?pay=pending" className="rounded-xl bg-ink px-3.5 py-2 text-sm font-medium text-paper hover:opacity-90">
              Fokus pending
            </Link>
          </div>
        </div>

        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Pesanan tampil" value={String(orderList.length)} hint="Hasil dari filter" />
          <Metric label="Pending bayar" value={String(pendingCount)} hint="Menunggu bayar" tone="warn" />
          <Metric label="Sudah lunas" value={String(paidCount)} hint="Pembayaran lunas" tone="ok" />
          <Metric label="Belum dikirim" value={String(fulfillPendingCount)} hint="Belum diproses" />
        </div>
      </section>

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-semibold text-ink">Data pesanan</h2>
            <p className="stamp text-ink/45">
              {orderList.length} pesanan · {formatIDR(totalRevenue)} total
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              name="pay"
              ariaLabel="Filter status pembayaran"
              options={PAY_TABS.map((t) => ({ value: t.id, label: t.label }))}
              defaultValue={payFilter}
            />
            <FilterDropdown
              name="fulfill"
              ariaLabel="Filter status pengiriman"
              options={FULFILL_TABS.map((t) => ({ value: t.id, label: t.label }))}
              defaultValue={fulfillFilter}
            />
            <DebouncedSearch aria-label="Cari ID, nama, atau email" placeholder="Cari ID/nama/email..." defaultValue={query} />
          </div>
        </div>

        {loadError && <div className="border-b border-line px-5 py-4 text-sm text-rose-700 dark:text-rose-100">{loadError}</div>}

        {!loadError && orderList.length === 0 && (
          <div className="px-5 py-10 text-center sm:px-6">
            <p className="stamp text-ink/40">Antrian kosong</p>
            <p className="mt-1 text-sm text-ink/60">
              Tidak ada pesanan untuk filter ini. Longgarkan filter atau tunggu checkout baru.
            </p>
          </div>
        )}

        {orderList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand/35 text-ink/45">
                <tr className="stamp">
                  <th className="px-5 py-3 font-normal w-12 text-center">No</th>
                  <th className="px-5 py-3 font-normal">Order</th>
                  <th className="px-5 py-3 font-normal">Pembeli</th>
                  <th className="px-5 py-3 font-normal">Metode</th>
                  <th className="px-5 py-3 font-normal">Total</th>
                  <th className="px-5 py-3 font-normal">Bayar</th>
                  <th className="px-5 py-3 font-normal">Kirim</th>
                  <th className="px-5 py-3 font-normal">Tanggal</th>
                  <th className="px-5 py-3 font-normal text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orderList.map((ord, i) => {
                  const pay = ord.paymentStatus || ord.status;
                  const fulfill = ord.fulfillmentStatus || "pending";

                  return (
                    <tr key={ord.id} className="transition hover:bg-sand/20">
                      <td className="px-5 py-4 text-center text-xs text-ink/50">{i + 1}</td>
                      <td className="px-5 py-4 font-semibold text-ink">
                        <Link href={`/admin/order/${ord.id}`} className="hover:underline">
                          {ord.id}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-ink">{ord.buyerName}</p>
                        <p className="text-xs text-ink/50">{ord.buyerEmail}</p>
                      </td>
                      <td className="px-5 py-4 uppercase text-xs font-semibold text-ink/70">
                        {ord.paymentMethod}
                      </td>
                      <td className="px-5 py-4 font-semibold tabular-nums text-ink">
                        {formatIDR(ord.totalIDR)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={statusClass(pay, "pay")}>{payLabel(pay)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={statusClass(fulfill, "fulfill")}>{fulfillLabel(fulfill)}</span>
                      </td>
                      <td className="px-5 py-4 text-xs text-ink/50">
                        {new Date(ord.createdAt).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/order/${ord.id}`}
                          className="inline-flex items-center rounded-xl border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink hover:bg-sand"
                        >
                          {pay === "pending" ? "Verifikasi" : fulfill !== "fulfilled" ? "Kirim akses" : "Detail"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
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
  tone?: "ok" | "warn";
}) {
  return (
    <div className="bg-paper p-5 sm:p-6">
      <p className="stamp text-ink/45">{label}</p>
      <p className={cn("mt-3 text-3xl font-semibold tracking-tight text-ink", tone === "ok" && "text-emerald-700", tone === "warn" && "text-amber-700")}>{value}</p>
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

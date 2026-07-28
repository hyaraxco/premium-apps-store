import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatIDR } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Status Order ${id}`,
    description: `Tracking status pesanan ${id} di Hyarax Apps.`,
  };
}

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = await params;

  // Best-effort: release stock for any unpaid orders past TTL
  if (process.env.DATABASE_URL) {
    try {
      const { expireUnpaidOrders } = await import("@/lib/orders/expire");
      await expireUnpaidOrders(20);
    } catch (e) {
      console.error("expireUnpaidOrders", e);
    }
  }

  let order = null;
  let items: (typeof schema.orderItems.$inferSelect)[] = [];
  let fulfillment: (typeof schema.orderFulfillments.$inferSelect) | null = null;

  if (process.env.DATABASE_URL) {
    try {
      const res = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);

      if (res.length > 0) {
        order = res[0];
        items = await db
          .select()
          .from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, orderId));

        const ful = await db
          .select()
          .from(schema.orderFulfillments)
          .where(eq(schema.orderFulfillments.orderId, orderId))
          .limit(1);
        if (ful.length > 0) fulfillment = ful[0];
      }
    } catch {
      // ignore
    }
  }

  if (!order) {
    notFound();
  }

  const statusKey = order.paymentStatus || order.status;
  const statusBadge = {
    pending: { label: "Menunggu Pembayaran", color: "bg-amber-500/15 text-amber-900 dark:text-amber-200" },
    paid: { label: "Pembayaran Diverifikasi", color: "bg-blue-500/15 text-blue-900 dark:text-blue-200" },
    fulfilled: { label: "Pesanan Selesai (Aktif)", color: "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200" },
    failed: { label: "Gagal / Batal", color: "bg-rose-500/15 text-rose-900 dark:text-rose-200" },
    cancelled: { label: "Dibatalkan / Expired", color: "bg-sand text-ink/70" },
  }[statusKey] || { label: statusKey, color: "bg-sand text-ink" };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="surface p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="stamp text-ink/40">STATUS PESANAN</span>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              {order.id}
            </h1>
          </div>
          <span className={`stamp rounded px-2.5 py-1 font-medium ${statusBadge.color}`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Buyer & Order Details */}
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div className="surface-muted p-3.5">
            <p className="stamp text-ink/40">Pembeli</p>
            <p className="mt-1 font-medium text-ink">{order.buyerName}</p>
            <p className="text-xs text-ink/60">{order.buyerEmail}</p>
          </div>
          <div className="surface-muted p-3.5">
            <p className="stamp text-ink/40">Metode &amp; Total</p>
            <p className="mt-1 font-medium text-ink uppercase">
              {order.paymentMethod} — {formatIDR(order.totalIDR)}
            </p>
            <p className="text-xs text-ink/60">
              Dibuat: {new Date(order.createdAt).toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Fulfillment Delivery Card if Fulfilled */}
        {fulfillment && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2">
            <h3 className="stamp text-emerald-900 dark:text-emerald-300 font-semibold">
              Akses Lisensi Anda (Selesai)
            </h3>
            {fulfillment.type === "invite" && fulfillment.inviteLink && (
              <div>
                <p className="text-sm text-ink/80">Silakan klik tautan invite berikut:</p>
                <a
                  href={fulfillment.inviteLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  Buka Invite Link
                </a>
              </div>
            )}
            {fulfillment.type === "credential" && (
              <div className="font-mono text-sm space-y-1 bg-paper p-3 rounded border border-line">
                <p><strong>Username:</strong> {fulfillment.username}</p>
                <p><strong>Password:</strong> {fulfillment.password}</p>
              </div>
            )}
          </div>
        )}

        {/* Order Items List */}
        <div>
          <h3 className="stamp text-ink/45 mb-2">Item Produk</h3>
          <ul className="divide-y divide-line border border-line bg-paper rounded-lg">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between items-center p-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{i.productName}</p>
                  <p className="text-xs text-ink/50">{i.variantLabel} x{i.qty}</p>
                </div>
                <span className="font-semibold tabular-nums text-ink">
                  {formatIDR(i.subtotalIDR)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row pt-2">
          <Link
            href="/katalog"
            transitionTypes={["nav-back"]}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-line bg-paper text-sm font-medium text-ink hover:bg-sand/40"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    </div>
  );
}

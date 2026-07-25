import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatIDR } from "@/lib/format";
import { updateOrderStatusAction, submitFulfillmentAction } from "../actions";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Admin Order ${id}`,
  };
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = await params;

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
    order = {
      id: orderId,
      buyerName: "Budi Santoso",
      buyerEmail: "budi@example.com",
      buyerWhatsapp: "081234567890",
      paymentMethod: "qris",
      totalIDR: 55000,
      status: "pending",
      paymentNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    items = [
      {
        id: "item-1",
        orderId,
        productId: "yt-premium",
        variantId: "yt-12m",
        productName: "YouTube Premium Member",
        variantLabel: "12 Bulan Promo",
        months: 12,
        qty: 1,
        unitPriceIDR: 55000,
        subtotalIDR: 55000,
      },
    ];
  }

  const isInviteType = items.some(
    (i) => i.productId.includes("yt") || i.productId.includes("ms") || i.productId.includes("g1") || i.productId.includes("canva")
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/order"
          className="rounded-md border border-line bg-paper px-2.5 py-1 text-xs text-ink/70 hover:bg-sand"
        >
          ← Kembali
        </Link>
        <h1 className="text-xl font-semibold text-ink">Detail Order {order.id}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main Details & Fulfillment Form */}
        <div className="space-y-6">
          <div className="surface p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-line pb-4">
              <div>
                <p className="stamp text-ink/40">Status Pembayaran</p>
                <h2 className="text-lg font-semibold uppercase text-ink">{order.status}</h2>
              </div>
              <div className="flex items-center gap-2">
                <form action={updateOrderStatusAction.bind(null, order.id, "paid")}>
                  <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Verifikasi Bayar
                  </Button>
                </form>
                <form action={updateOrderStatusAction.bind(null, order.id, "failed")}>
                  <button type="submit" className="text-xs text-rose-600 hover:underline">
                    Batalkan
                  </button>
                </form>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="stamp text-ink/40">Pembeli</p>
                <p className="font-medium text-ink">{order.buyerName}</p>
                <p className="text-xs text-ink/60">{order.buyerEmail}</p>
                {order.buyerWhatsapp && (
                  <a
                    href={`https://wa.me/${order.buyerWhatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-600 hover:underline block mt-1"
                  >
                    WA: {order.buyerWhatsapp}
                  </a>
                )}
              </div>
              <div>
                <p className="stamp text-ink/40">Metode &amp; Total</p>
                <p className="font-medium text-ink uppercase">{order.paymentMethod}</p>
                <p className="font-semibold text-lg text-ink">{formatIDR(order.totalIDR)}</p>
              </div>
            </div>
          </div>

          {/* Fulfillment Form (Invite vs Credential) */}
          <div className="surface p-6">
            <h2 className="text-base font-semibold text-ink">
              Form Pengiriman Akses (Fulfillment)
            </h2>
            <p className="mt-1 text-xs text-ink/60">
              Input detail akses di bawah ini. Setelah disimpan, status order berubah ke <strong className="text-emerald-700">fulfilled</strong> &amp; email otomatis dikirim ke pembeli.
            </p>

            <form action={submitFulfillmentAction} className="mt-4 space-y-4">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="type" value={isInviteType ? "invite" : "credential"} />

              {isInviteType ? (
                <div>
                  <label className="block text-sm font-medium text-ink">
                    Invite Link Aktivasi
                  </label>
                  <textarea
                    name="inviteLink"
                    rows={3}
                    defaultValue={fulfillment?.inviteLink || ""}
                    placeholder="https://..."
                    required
                    className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink font-mono"
                  />
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-ink">
                      Username / Email
                    </label>
                    <input
                      name="username"
                      type="text"
                      defaultValue={fulfillment?.username || ""}
                      placeholder="account@seller.com"
                      required
                      className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink">
                      Password
                    </label>
                    <input
                      name="password"
                      type="text"
                      defaultValue={fulfillment?.password || ""}
                      placeholder="Pass123!"
                      required
                      className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-ink">
                  Catatan Tambahan untuk Buyer (opsional)
                </label>
                <input
                  name="notes"
                  type="text"
                  defaultValue={fulfillment?.notes || ""}
                  placeholder="Misal: Jangan ganti PIN profil 1"
                  className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink"
                />
              </div>

              <Button type="submit" size="md" className="w-full sm:w-auto">
                Kirim Akses &amp; Tandai Selesai
              </Button>
            </form>
          </div>
        </div>

        {/* Order Items Sidebar */}
        <aside className="surface p-5 space-y-3">
          <p className="stamp text-ink/40">Item Pesanan</p>
          <ul className="divide-y divide-line border-b border-line pb-3 text-sm">
            {items.map((i) => (
              <li key={i.id} className="py-2.5 flex justify-between gap-2">
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
          <div className="flex justify-between font-semibold text-ink text-base">
            <span>Total</span>
            <span className="tabular-nums">{formatIDR(order.totalIDR)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

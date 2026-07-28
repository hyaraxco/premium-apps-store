import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { formatIDR } from "@/lib/format";
import { markOrderPaidAction, submitUnitFulfillmentAction } from "../actions";
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

  let order: typeof schema.orders.$inferSelect | null = null;
  let items: (typeof schema.orderItems.$inferSelect)[] = [];
  let units: (typeof schema.orderFulfillmentUnits.$inferSelect)[] = [];

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
          .where(eq(schema.orderItems.orderId, orderId))
          .orderBy(asc(schema.orderItems.id));

        units = await db
          .select()
          .from(schema.orderFulfillmentUnits)
          .where(eq(schema.orderFulfillmentUnits.orderId, orderId))
          .orderBy(asc(schema.orderFulfillmentUnits.orderItemId), asc(schema.orderFulfillmentUnits.unitIndex));
      }
    } catch {
      // ignore
    }
  }

  if (!order) {
    notFound();
  }

  const isPaid = order.paymentStatus === "paid";
  const isPending = order.paymentStatus === "pending";

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
        <div className="space-y-6">
          <div className="surface p-6 space-y-4">
            <div className="flex justify-between items-start border-b border-line pb-4">
              <div>
                <p className="stamp text-ink/40">Status Pembayaran</p>
                <h2 className="text-lg font-semibold uppercase text-ink">
                  {order.paymentStatus || order.status}
                  <span className="ml-2 text-xs font-normal normal-case text-ink/50">
                    <span className="stamp px-1.5 py-0.5 rounded border border-line bg-paper">fulfill: {order.fulfillmentStatus}</span>
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {isPending && (
                  <form action={markOrderPaidAction.bind(null, order.id, "")}>
                    <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Verifikasi Bayar
                    </Button>
                  </form>
                )}
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

          {/* Fulfillment Forms per Item Unit */}
          <div className="surface p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-ink">Pengiriman Akses (Per Unit)</h2>
              <p className="mt-1 text-xs text-ink/60">
                Input detail akses untuk setiap unit pesanan. Tombol disabled jika belum lunas.
              </p>
            </div>

            {items.map((item) => {
              const isInvite = item.fulfillmentType === "invite";
              const rows = Array.from({ length: item.qty }, (_, i) => i + 1);

              return (
                <div key={item.id} className="space-y-4 border border-line rounded-lg p-4 bg-sand/20">
                  <h3 className="font-semibold text-sm text-ink">{item.productName} ({item.variantLabel})</h3>
                  
                  {rows.map((unitIndex) => {
                    const existingUnit = units.find(u => u.orderItemId === item.id && u.unitIndex === unitIndex);
                    
                    return (
                      <form key={unitIndex} action={submitUnitFulfillmentAction} className="mt-4 space-y-3 pt-4 border-t border-line/50">
                        <input type="hidden" name="orderId" value={order!.id} />
                        <input type="hidden" name="orderItemId" value={item.id} />
                        <input type="hidden" name="unitIndex" value={unitIndex.toString()} />
                        <input type="hidden" name="type" value={isInvite ? "invite" : "credential"} />
                        
                        <div className="flex items-center justify-between">
                          <h4 className="stamp text-ink/50">Unit {unitIndex} dari {item.qty}</h4>
                          {existingUnit?.unitStatus === "sent" && (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Sent</span>
                          )}
                        </div>

                        {isInvite ? (
                          <div>
                            <label className="block text-xs font-medium text-ink">Invite Link</label>
                            <input
                              type="text"
                              name="inviteLink"
                              defaultValue={existingUnit?.inviteLink || ""}
                              required
                              disabled={!isPaid}
                              placeholder="https://..."
                              className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-1.5 text-sm"
                            />
                          </div>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="block text-xs font-medium text-ink">Username</label>
                              <input
                                name="username"
                                type="text"
                                defaultValue={existingUnit?.username || ""}
                                required
                                disabled={!isPaid}
                                className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-1.5 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-ink">Password</label>
                              <input
                                name="password"
                                type="text"
                                defaultValue={existingUnit?.secretCiphertext || ""}
                                required
                                disabled={!isPaid}
                                className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-1.5 text-sm"
                              />
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-medium text-ink">Catatan</label>
                          <input
                            name="notes"
                            type="text"
                            defaultValue={existingUnit?.notes || ""}
                            disabled={!isPaid}
                            className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-1.5 text-sm"
                          />
                        </div>
                        <Button type="submit" size="sm" disabled={!isPaid}>
                          {existingUnit ? "Kirim Ulang Email" : "Kirim & Simpan"}
                        </Button>
                      </form>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="surface p-5 space-y-3 h-fit">
          <p className="stamp text-ink/40">Ringkasan</p>
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

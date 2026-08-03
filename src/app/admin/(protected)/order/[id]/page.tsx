import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { formatIDR } from "@/lib/format";
import {
  markOrderPaidAction,
  submitUnitFulfillmentAction,
} from "../actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { AdminFlash } from "@/components/admin-flash";
import { fulfillLabel, payLabel } from "@/lib/admin-flash";
import { cn } from "@/lib/utils";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flash?: string; msg?: string }>;
}) {
  await requireAdmin();
  const { id: orderId } = await params;
  const sp = await searchParams;

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
          .orderBy(
            asc(schema.orderFulfillmentUnits.orderItemId),
            asc(schema.orderFulfillmentUnits.unitIndex),
          );
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

  let totalRequired = 0;
  items.forEach((i) => {
    totalRequired += i.qty;
  });
  const totalSent = units.filter((u) => u.unitStatus === "sent").length;

  return (
    <div className="space-y-6">
      <AdminFlash
        searchParams={sp}
        clearHref={`/admin/order/${orderId}`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/order"
          className="rounded-md border border-line bg-paper px-2.5 py-1 text-xs text-ink/70 hover:bg-sand"
        >
          ← Daftar order
        </Link>
        <h1 className="text-xl font-semibold text-ink">
          Order <span className="font-mono text-base">{order.id}</span>
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="surface p-6 space-y-4">
            <div className="flex flex-wrap justify-between items-start gap-4 border-b border-line pb-4">
              <div className="space-y-2">
                <p className="stamp text-ink/40">Status</p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "stamp rounded border border-line px-2 py-0.5 text-[11px]",
                      isPending &&
                        "bg-amber-500/15 text-amber-950 dark:text-amber-100",
                      isPaid &&
                        "bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
                    )}
                  >
                    Bayar: {payLabel(order.paymentStatus || order.status)}
                  </span>
                  <span className="stamp rounded border border-line bg-sand/50 px-2 py-0.5 text-[11px]">
                    Kirim: {fulfillLabel(order.fulfillmentStatus)} · {totalSent}/
                    {totalRequired} unit
                  </span>
                </div>
              </div>

              {isPending && (
                <form
                  action={markOrderPaidAction}
                  className="flex w-full max-w-xs flex-col gap-2 sm:w-auto"
                >
                  <input type="hidden" name="orderId" value={order.id} />
                  <label className="block text-xs font-medium text-ink">
                    Ref transfer / bukti (opsional)
                    <input
                      name="paymentReference"
                      type="text"
                      placeholder="TRX / nama pengirim"
                      className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-1.5 text-sm"
                    />
                  </label>
                  <PendingSubmitButton
                    size="sm"
                    pendingLabel="Memverifikasi…"
                    className="w-full sm:w-auto"
                  >
                    Verifikasi lunas
                  </PendingSubmitButton>
                </form>
              )}
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
                    className="mt-1 block text-xs text-emerald-700 hover:underline dark:text-emerald-300"
                  >
                    WA: {order.buyerWhatsapp}
                  </a>
                )}
              </div>
              <div>
                <p className="stamp text-ink/40">Metode &amp; total</p>
                <p className="font-medium uppercase text-ink">
                  {order.paymentMethod}
                </p>
                <p className="text-lg font-semibold tabular-nums text-ink">
                  {formatIDR(order.totalIDR)}
                </p>
                {order.paymentReference && (
                  <p className="mt-1 text-xs text-ink/50">
                    Ref: {order.paymentReference}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="surface p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-ink">
                Pengiriman akses (per unit)
              </h2>
              <p className="mt-1 text-xs text-ink/60">
                Progress {totalSent}/{totalRequired} unit terkirim.
                {!isPaid && " Tombol nonaktif sampai order lunas."}
              </p>
            </div>

            {items.map((item) => {
              const isInvite = item.fulfillmentType === "invite";
              const rows = Array.from({ length: item.qty }, (_, i) => i + 1);
              const itemSent = rows.filter((ui) =>
                units.some(
                  (u) =>
                    u.orderItemId === item.id &&
                    u.unitIndex === ui &&
                    u.unitStatus === "sent",
                ),
              ).length;

              return (
                <div
                  key={item.id}
                  className="space-y-4 rounded-lg border border-line bg-sand/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-ink">
                      {item.productName}{" "}
                      <span className="font-normal text-ink/50">
                        ({item.variantLabel})
                      </span>
                    </h3>
                    <span className="stamp text-ink/45">
                      {itemSent}/{item.qty} unit ·{" "}
                      {isInvite ? "invite" : "credential"}
                    </span>
                  </div>

                  {rows.map((unitIndex) => {
                    const existingUnit = units.find(
                      (u) =>
                        u.orderItemId === item.id && u.unitIndex === unitIndex,
                    );
                    const sent = existingUnit?.unitStatus === "sent";

                    return (
                      <form
                        key={unitIndex}
                        action={submitUnitFulfillmentAction}
                        className="mt-4 space-y-3 border-t border-line/50 pt-4"
                      >
                        <input type="hidden" name="orderId" value={order!.id} />
                        <input type="hidden" name="orderItemId" value={item.id} />
                        <input
                          type="hidden"
                          name="unitIndex"
                          value={unitIndex.toString()}
                        />
                        <input
                          type="hidden"
                          name="type"
                          value={isInvite ? "invite" : "credential"}
                        />

                        <div className="flex items-center justify-between">
                          <h4 className="stamp text-ink/50">
                            Unit {unitIndex} dari {item.qty}
                          </h4>
                          {sent && (
                            <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                              Terkirim
                            </span>
                          )}
                        </div>

                        {isInvite ? (
                          <div>
                            <label className="block text-xs font-medium text-ink">
                              Invite link
                            </label>
                            <input
                              type="url"
                              name="inviteLink"
                              defaultValue={existingUnit?.inviteLink || ""}
                              required={isPaid}
                              disabled={!isPaid}
                              placeholder="https://…"
                              className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-1.5 text-sm disabled:opacity-50"
                            />
                          </div>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="block text-xs font-medium text-ink">
                                Username
                              </label>
                              <input
                                name="username"
                                type="text"
                                defaultValue={existingUnit?.username || ""}
                                required={isPaid}
                                disabled={!isPaid}
                                className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-1.5 text-sm disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-ink">
                                Password
                              </label>
                              <input
                                name="password"
                                type="text"
                                autoComplete="off"
                                placeholder={
                                  existingUnit?.secretCiphertext
                                    ? "Kosongkan = pakai yang tersimpan (email tanpa password)"
                                    : "Password plain (dienkripsi saat simpan)"
                                }
                                required={isPaid && !existingUnit?.secretCiphertext}
                                disabled={!isPaid}
                                className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-1.5 text-sm disabled:opacity-50"
                              />
                              <p className="mt-1 text-[11px] text-ink/45">
                                Tidak menampilkan ciphertext. Isi ulang jika kirim
                                email harus bawa password.
                              </p>
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-medium text-ink">
                            Catatan
                          </label>
                          <input
                            name="notes"
                            type="text"
                            defaultValue={existingUnit?.notes || ""}
                            disabled={!isPaid}
                            className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-1.5 text-sm disabled:opacity-50"
                          />
                        </div>
                        <PendingSubmitButton
                          size="sm"
                          disabled={!isPaid}
                          pendingLabel="Mengirim…"
                        >
                          {existingUnit ? "Simpan & kirim ulang email" : "Kirim & simpan"}
                        </PendingSubmitButton>
                      </form>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="surface h-fit space-y-3 p-5">
          <p className="stamp text-ink/40">Ringkasan item</p>
          <ul className="divide-y divide-line border-b border-line pb-3 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2 py-2.5">
                <div>
                  <p className="font-medium text-ink">{i.productName}</p>
                  <p className="text-xs text-ink/50">
                    {i.variantLabel} ×{i.qty}
                  </p>
                </div>
                <span className="font-semibold tabular-nums text-ink">
                  {formatIDR(i.subtotalIDR)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-base font-semibold text-ink">
            <span>Total</span>
            <span className="tabular-nums">{formatIDR(order.totalIDR)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

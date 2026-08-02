import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatIDR, sanitizeWaNumber } from "@/lib/format";
import { hashPublicOrderToken } from "@/lib/order-token";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { token } = await params;
  return {
    title: "Status Pesanan",
    description: "Lacak status pesanan Hyarax Apps (tanpa menampilkan akses lisensi).",
    robots: { index: false, follow: false },
  };
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain || !user) return "•••";
  const head = user.slice(0, 1);
  return `${head}•••@${domain}`;
}

/**
 * Public tracking by unguessable token.
 * Lookup: SHA-256(token) === orders.public_token_hash
 * Never shows invite links or credentials — those are email-only.
 */
export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token: publicToken } = await params;

  if (!publicToken || publicToken.length < 16) {
    notFound();
  }

  // Reject guessable order-id style access on public route
  if (publicToken.startsWith("SB-")) {
    notFound();
  }

  if (process.env.DATABASE_URL) {
    try {
      const { expireUnpaidOrders } = await import("@/lib/orders/expire");
      await expireUnpaidOrders(20);
    } catch (e) {
      console.error("expireUnpaidOrders", e);
    }
  }

  if (!process.env.DATABASE_URL) {
    notFound();
  }

  const tokenHash = hashPublicOrderToken(publicToken);

  let order: typeof schema.orders.$inferSelect | null = null;
  let items: (typeof schema.orderItems.$inferSelect)[] = [];
  let adminWa = "";

  try {
    const res = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.publicTokenHash, tokenHash))
      .limit(1);

    if (res[0]) {
      order = res[0];
      items = await db
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, order.id));

      const settings = await db
        .select()
        .from(schema.adminSettings)
        .where(eq(schema.adminSettings.key, "admin_wa"))
        .limit(1);
      adminWa = settings[0]?.value ?? "";
    }
  } catch (e) {
    console.error("order track lookup", e);
  }

  if (!order) {
    notFound();
  }

  const statusKey = order.paymentStatus || order.status;
  const statusBadge = {
    pending: { label: "Menunggu Pembayaran", color: "bg-sand text-ink" },
    paid: { label: "Pembayaran Diverifikasi", color: "bg-sand text-ink" },
    fulfilled: { label: "Pesanan Selesai", color: "bg-sand text-ink" },
    failed: { label: "Gagal", color: "bg-rose-500/15 text-rose-900 dark:text-rose-200" },
    cancelled: { label: "Dibatalkan / Expired", color: "bg-sand text-ink/50" },
    refunded: { label: "Refund", color: "bg-sand text-ink/50" },
  }[statusKey] || { label: statusKey, color: "bg-sand text-ink" };

  const nowTime = new Date().getTime();
  const expiresAt = order.paymentExpiresAt
    ? new Date(order.paymentExpiresAt)
    : null;
  const pending = statusKey === "pending";
  const expired =
    pending && expiresAt != null && expiresAt.getTime() < nowTime;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="surface space-y-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="stamp text-ink/40">STATUS PESANAN</span>
            <h1 className="mt-1 font-mono text-lg font-semibold tracking-tight text-ink sm:text-xl">
              {order.id}
            </h1>
          </div>
          <span
            className={`stamp rounded px-2.5 py-1 font-medium ${statusBadge.color}`}
          >
            {expired ? "Expired / Dibatalkan" : statusBadge.label}
          </span>
        </div>

        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div className="surface-muted p-3.5">
            <p className="stamp text-ink/40">Pembeli</p>
            <p className="mt-1 font-medium text-ink">{order.buyerName}</p>
            <p className="text-xs text-ink/60">{maskEmail(order.buyerEmail)}</p>
          </div>
          <div className="surface-muted p-3.5">
            <p className="stamp text-ink/40">Metode &amp; Total</p>
            <p className="mt-1 font-medium uppercase text-ink">
              {order.paymentMethod} — {formatIDR(order.totalIDR)}
            </p>
            <p className="text-xs text-ink/60">
              Dibuat: {new Date(order.createdAt).toLocaleString("id-ID")}
            </p>
            {pending && expiresAt && !expired && (
              <p className="mt-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                Bayar sebelum: {expiresAt.toLocaleString("id-ID")}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-sand/30 px-3.5 py-3 text-xs leading-relaxed text-ink/65">
          <p className="stamp text-ink/40">Aktivasi lisensi</p>
          <p className="mt-1">
            Invite link / username &amp; password dikirim ke email Anda setelah
            pembayaran diverifikasi — tidak ditampilkan di halaman ini demi
            keamanan.
          </p>
          {(order.fulfillmentStatus === "fulfilled" ||
            order.fulfillmentStatus === "partial") && (
            <p className="mt-1 font-medium text-ink/80">
              Status aktivasi: {order.fulfillmentStatus}. Cek inbox email
              (termasuk spam).
            </p>
          )}
        </div>

        <div>
          <h3 className="stamp mb-2 text-ink/45">Item Produk</h3>
          <ul className="divide-y divide-line rounded-lg border border-line bg-paper">
            {items.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between p-3 text-sm"
              >
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
        </div>

        <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
          {pending && !expired && (
            <Link
              href={`/checkout/sukses?order=${order.id}&method=${order.paymentMethod}&token=${publicToken}`}
              className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border-0 bg-ink text-sm font-medium text-paper shadow-sm hover:opacity-90"
            >
              Lanjutkan Pembayaran
            </Link>
          )}
          {adminWa && (
            <a
              href={`https://wa.me/${sanitizeWaNumber(adminWa)}?text=${encodeURIComponent(
                `Halo Admin Hyarax Apps,\n\nSaya ingin bertanya mengenai Order: ${order.id}\nStatus: ${statusBadge.label}\nTotal: ${formatIDR(order.totalIDR)}\n\nMohon bantuannya. Terima kasih!`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Hubungi WA Support
            </a>
          )}
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

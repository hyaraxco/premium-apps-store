import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import {
  DEFAULT_MERCHANT_QRIS_STATIC,
  generateDynamicQris,
  isValidQrisStatic,
} from "@/lib/qris";
import { formatIDR, sanitizeWaNumber } from "@/lib/format";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Order Dibuat — Menunggu Pembayaran",
  description: "Instruksi pembayaran dan lacak status pesanan.",
};

async function loadQrisStatic(): Promise<string> {
  if (process.env.DATABASE_URL) {
    try {
      const rows = await db
        .select()
        .from(schema.adminSettings)
        .where(eq(schema.adminSettings.key, "qris_string"))
        .limit(1);
      const fromDb = rows[0]?.value?.trim() ?? "";
      // Only accept structurally valid merchant static (CRC + top-level TLV).
      // Reject empty / demo LinkAja / corrupt paste — fall back to real GoPay default.
      if (fromDb && isValidQrisStatic(fromDb)) return fromDb;
      if (fromDb) {
        console.warn(
          "admin_settings.qris_string invalid EMV/CRC; using DEFAULT_MERCHANT_QRIS_STATIC",
        );
      }
    } catch {
      // fall through
    }
  }
  return DEFAULT_MERCHANT_QRIS_STATIC;
}

export default async function SuksesPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; method?: string; token?: string }>;
}) {
  const { order: orderId, method, token: publicToken } = await searchParams;
  if (!orderId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-ink/60">
        Order tidak ditemukan. Selesaikan checkout dulu.
      </div>
    );
  }

  const code = orderId;
  let orderData: typeof schema.orders.$inferSelect | null = null;
  if (process.env.DATABASE_URL) {
    try {
      const found = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, orderId))
        .limit(1);
      if (found.length > 0) orderData = found[0];
    } catch {
      // ignore
    }
  }

  if (process.env.DATABASE_URL && !orderData) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-ink/60">
        Order <span className="font-mono">{code}</span> tidak ditemukan.
      </div>
    );
  }

  const paymentMethod =
    (orderData?.paymentMethod as string) || method || "qris";
  // Without DB, cannot invent amount — show instructions without fake totals
  const totalAmount = orderData?.totalIDR ?? null;

  const staticQris = await loadQrisStatic();
  
  let bcaNumber: string | null = null;
  let bcaName: string | null = null;
  let seabankNumber: string | null = null;
  let seabankName: string | null = null;
  let adminWa = "";
  
  if (process.env.DATABASE_URL) {
    try {
      const settings = await db.select().from(schema.adminSettings);
      for (const row of settings) {
        if (row.key === "bca_number") bcaNumber = row.value || null;
        if (row.key === "bca_name") bcaName = row.value || null;
        if (row.key === "seabank_number") seabankNumber = row.value || null;
        if (row.key === "seabank_name") seabankName = row.value || null;
        if (row.key === "admin_wa") adminWa = row.value || "";
      }
    } catch {
      // Settings read failed — bank details stay null, show "hubungi admin"
    }
  }

  let dynamicQrisString = "";
  let qrisError = "";
  if (paymentMethod === "qris" && totalAmount != null && totalAmount > 0) {
    try {
      dynamicQrisString = generateDynamicQris(staticQris, totalAmount);
    } catch (e) {
      qrisError =
        e instanceof Error ? e.message : "Gagal membuat QRIS dinamis";
      console.error("QRIS generate error:", e);
    }
  }

  // Generate local QR Code Data URL server-side (no external API needed)
  let qrisImageUrl = "";
  if (dynamicQrisString) {
    try {
      qrisImageUrl = await QRCode.toDataURL(dynamicQrisString, {
        width: 260,
        margin: 1,
        color: {
          dark: "#1c1917",
          light: "#ffffff",
        },
      });
    } catch (e) {
      console.error("QR Code generation error:", e);
      qrisError = "Gagal merender gambar QR";
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
      {/* License fulfillment ticket */}
      <div className="surface overflow-hidden p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="stamp text-ink/40">TIKET FULFILLMENT</span>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              Order {code}
            </h1>
          </div>
          <span className="stamp rounded bg-amber-500/15 px-2 py-1 text-amber-900 dark:text-amber-200">
            MENUNGGU BAYAR
          </span>
        </div>

        <div className="mt-6 space-y-4 text-sm text-ink/75">
          <p>
            Terima kasih! Pesanan Anda telah dibuat. Silakan lakukan pembayaran
            {totalAmount != null ? (
              <>
                sebesar{" "}
                <strong className="text-ink font-semibold">
                  {formatIDR(totalAmount)}
                </strong>{" "}
                untuk memproses aktivasi.
              </>
            ) : (
              <>sesuai total di email konfirmasi untuk memproses aktivasi.</>
            )}
          </p>

          {/* Detailed Payment Instructions */}
          {paymentMethod === "qris" && (
            <div className="rounded-lg border border-line bg-sand/30 p-5 text-center">
              <p className="stamp text-ink/40">SCAN QRIS DINAMIS</p>
              {qrisImageUrl ? (
                <div className="mt-3 inline-block rounded-lg border border-line bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrisImageUrl}
                    alt="QRIS Pembayaran"
                    className="h-56 w-56 mx-auto"
                  />
                </div>
              ) : (
                <p className="mt-3 text-xs text-red-700 dark:text-red-300">
                  {qrisError ||
                    "QRIS belum siap. Pastikan string QRIS statis toko di Admin → Pengaturan valid."}
                </p>
              )}
              <p className="mt-2 text-xs text-ink/60">
                Scan menggunakan BCA, Mandiri, GoPay, OVO, Dana, atau m-Banking apapun.
                {totalAmount != null && (
                  <>
                    Nominal <strong>{formatIDR(totalAmount)}</strong> akan terisi
                    otomatis.
                  </>
                )}
              </p>
            </div>
          )}

          {paymentMethod === "bca" && (
            <div className="rounded-lg border border-line bg-sand/30 p-4 space-y-2">
              <p className="stamp text-ink/40">TRANSFER BANK BCA</p>
              {bcaNumber ? (
                <>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span>No. Rekening:</span>
                    <span className="font-mono text-base text-ink">{bcaNumber}</span>
                  </div>
                  {bcaName && (
                    <div className="flex justify-between items-center text-sm">
                      <span>Atas Nama:</span>
                      <span className="text-ink">{bcaName}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Info rekening BCA belum dikonfigurasi. Hubungi admin via WA untuk detail transfer.
                </p>
              )}
            </div>
          )}

          {paymentMethod === "seabank" && (
            <div className="rounded-lg border border-line bg-sand/30 p-4 space-y-2">
              <p className="stamp text-ink/40">TRANSFER BANK SEABANK</p>
              {seabankNumber ? (
                <>
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span>No. Rekening:</span>
                    <span className="font-mono text-base text-ink">{seabankNumber}</span>
                  </div>
                  {seabankName && (
                    <div className="flex justify-between items-center text-sm">
                      <span>Atas Nama:</span>
                      <span className="text-ink">{seabankName}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Info rekening SeaBank belum dikonfigurasi. Hubungi admin via WA untuk detail transfer.
                </p>
              )}
            </div>
          )}

          <div className="rounded-lg border border-line bg-paper p-4 space-y-2">
            <h3 className="stamp text-ink/45">Langkah Selanjutnya</h3>
            <ol className="list-decimal pl-4 space-y-1 text-xs text-ink/70">
              <li>Selesaikan pembayaran sesuai nominal persis.</li>
              <li>
                Buka halaman status order atau klik tombol WA Support untuk konfirmasi.
              </li>
              <li>Detail lisensi/invite link akan dikirim ke email Anda.</li>
            </ol>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
          {adminWa && (
            <a
              href={`https://wa.me/${sanitizeWaNumber(adminWa)}?text=${encodeURIComponent(
                `Halo Admin Hyarax Apps,\n\nSaya sudah bayar untuk:\n- Order ID: ${code}\n- Total: ${totalAmount != null ? formatIDR(totalAmount) : "-"}\n- Metode: ${(paymentMethod || "").toUpperCase()}\n\nMohon dicek dan dikirim. Terima kasih!`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Konfirmasi via WA
            </a>
          )}
          {publicToken ? (
            <Link
              href={`/order/${encodeURIComponent(publicToken)}`}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-ink px-5 text-sm font-medium text-paper hover:bg-ink/90"
            >
              Lacak Status Order
            </Link>
          ) : (
            <p className="flex-1 text-center text-xs text-ink/50 self-center">
              Link lacak dikirim ke email konfirmasi (bukan nomor order saja).
            </p>
          )}
          <Link
            href="/katalog"
            transitionTypes={["nav-back"]}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-line bg-paper px-5 text-sm font-medium text-ink hover:bg-sand/50"
          >
            Kembali ke Katalog
          </Link>
        </div>
      </div>
    </div>
  );
}

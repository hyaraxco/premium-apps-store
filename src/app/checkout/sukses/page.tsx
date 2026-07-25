import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { generateDynamicQris } from "@/lib/qris";
import { formatIDR } from "@/lib/format";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Order Berhasil",
  description: "Instruksi pembayaran dan detail order.",
};

const defaultQrisStatic =
  "00020101021126590014ID.LINKAJA.WWW01189360091400000000000215ID10254005290260303A0151440014ID.GPN.WWW02150000000000000005204581253033605802ID5921WARUNG BU DIR, TJHALANG6007BANDUNG61054011562070703A016304";

export default async function SuksesPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; method?: string }>;
}) {
  const { order: orderId, method } = await searchParams;
  const code = orderId || "SB-20260725-1001";
  const paymentMethod = method || "qris";

  let orderData = null;
  if (process.env.DATABASE_URL && orderId) {
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

  const totalAmount = orderData?.totalIDR || 20000;
  const dynamicQrisString = generateDynamicQris(defaultQrisStatic, totalAmount);
  
  // Generate local QR Code Data URL server-side (no external API needed)
  let qrisImageUrl = "";
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
            sebesar <strong className="text-ink font-semibold">{formatIDR(totalAmount)}</strong> untuk memproses aktivasi.
          </p>

          {/* Detailed Payment Instructions */}
          {paymentMethod === "qris" && (
            <div className="rounded-lg border border-line bg-sand/30 p-5 text-center">
              <p className="stamp text-ink/40">SCAN QRIS DINAMIS</p>
              {qrisImageUrl && (
                <div className="mt-3 inline-block rounded-lg border border-line bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrisImageUrl}
                    alt="QRIS Pembayaran"
                    className="h-56 w-56 mx-auto"
                  />
                </div>
              )}
              <p className="mt-2 text-xs text-ink/60">
                Scan menggunakan BCA, Mandiri, GoPay, OVO, Dana, atau m-Banking apapun.
                Nominal <strong>{formatIDR(totalAmount)}</strong> akan terisi otomatis.
              </p>
            </div>
          )}

          {paymentMethod === "bca" && (
            <div className="rounded-lg border border-line bg-sand/30 p-4 space-y-2">
              <p className="stamp text-ink/40">TRANSFER BANK BCA</p>
              <div className="flex justify-between items-center text-sm font-medium">
                <span>No. Rekening:</span>
                <span className="font-mono text-base text-ink">1234567890</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Atas Nama:</span>
                <span className="text-ink">WARUNG BU DIR</span>
              </div>
            </div>
          )}

          {paymentMethod === "seabank" && (
            <div className="rounded-lg border border-line bg-sand/30 p-4 space-y-2">
              <p className="stamp text-ink/40">TRANSFER BANK SEABANK</p>
              <div className="flex justify-between items-center text-sm font-medium">
                <span>No. Rekening:</span>
                <span className="font-mono text-base text-ink">9876543210</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Atas Nama:</span>
                <span className="text-ink">WARUNG BU DIR</span>
              </div>
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
          <Link
            href={`/order/${code}`}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-ink px-5 text-sm font-medium text-paper hover:bg-ink/90"
          >
            Lacak Status Order
          </Link>
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

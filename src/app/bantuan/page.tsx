import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bantuan",
  description: "FAQ dan kontak support Stackbay.",
};

const faqs = [
  {
    q: "Apakah ini toko resmi Notion / Figma / OpenAI?",
    a: "Tidak. Stackbay adalah demo storefront reseller-style. Di produksi, pastikan model bisnis & ToS vendor Anda legal sebelum menjual ulang.",
  },
  {
    q: "Berapa lama aktivasi?",
    a: "Tercantum di setiap halaman produk (contoh: 5–15 menit, 1–3 jam). Pre-order bisa 1×24 jam. Status stok: siap kirim, terbatas, atau pre-order.",
  },
  {
    q: "Bisa upgrade akun existing?",
    a: "Ya untuk banyak produk. Tulis email akun target di catatan checkout. Beberapa vendor mewajibkan akun baru — kami konfirmasi jika ada kendala.",
  },
  {
    q: "Bagaimana refund?",
    a: "Demo ini tidak memproses bayar nyata. Kebijakan produksi yang disarankan: refund jika aktivasi gagal total dalam 24 jam dan seat belum digunakan.",
  },
  {
    q: "Metode pembayaran apa saja?",
    a: "UI mendukung QRIS, transfer bank, dan e-wallet. Integrasi Midtrans/Xendit/dll belum dihubungkan — tinggal pasang di layer checkout.",
  },
  {
    q: "Apakah harga termasuk PPN?",
    a: "Harga demo ditampilkan final dalam IDR. Sesuaikan PPN & invoice formal saat go-live.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="stamp text-ink/45">Support</p>
      <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">
        Bantuan &amp; FAQ
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/65">
        Jawaban singkat seputar lisensi, aktivasi, dan alur demo. Untuk isu
        order, siapkan nomor order (format SB-…).
      </p>

      <div className="mt-10 space-y-2.5">
        {faqs.map((item) => (
          <details
            key={item.q}
            className="group border border-line bg-paper open:bg-sand/20 rounded-[var(--radius-lg)]"
          >
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-ink marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                {item.q}
                <span
                  className="stamp shrink-0 text-ink/35 transition group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </span>
            </summary>
            <p className="border-t border-line/80 px-5 py-4 text-sm leading-relaxed text-ink/65">
              {item.a}
            </p>
          </details>
        ))}
      </div>

      <section className="mt-12 border border-line bg-ink px-6 py-8 text-paper rounded-[var(--radius-xl)]">
        <p className="stamp text-paper/40">Contact</p>
        <h2 className="mt-1 text-lg font-semibold">Masih butuh bantuan?</h2>
        <p className="mt-2 text-sm text-paper/65">
          Siapkan nomor order (SB-…). Demo contact — ganti dengan WhatsApp /
          email bisnis Anda.
        </p>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="stamp text-paper/40">Email</dt>
            <dd className="mt-1 font-medium">support@stackbay.demo</dd>
          </div>
          <div>
            <dt className="stamp text-paper/40">Jam operasional</dt>
            <dd className="mt-1 font-medium">Sen–Sab · 09.00–21.00 WIB</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

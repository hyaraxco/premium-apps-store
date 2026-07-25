import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cara kerja",
  description: "Bagaimana Stackbay menjual dan mengaktifkan lisensi digital.",
};

const steps = [
  {
    n: "01",
    title: "Pilih app & periode",
    body: "Filter katalog by kategori (AI, design, developer…). Cek billing (bulanan/tahunan), status stok, dan platform.",
  },
  {
    n: "02",
    title: "Checkout & bayar",
    body: "Isi email penerima lisensi dan catatan (upgrade existing / akun baru). Pilih QRIS, transfer, atau e-wallet.",
  },
  {
    n: "03",
    title: "Aktivasi digital",
    body: "Tim memproses invite, license key, atau upgrade sesuai produk. Estimasi tertera di halaman detail (5 menit–3 jam).",
  },
  {
    n: "04",
    title: "Pakai & support",
    body: "Jika invite gagal atau seat belum muncul, hubungi support dengan nomor order. Jam operasional 09–21 WIB.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="stamp text-ink/45">Proses</p>
      <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">
        Cara kerja Stackbay
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink/65">
        Kami fokusasi katalog lisensi premium &amp; subscription. Bukan app
        store resmi vendor — alur dirancang agar jelas: apa yang dibeli, kapan
        aktif, ke mana dikirim.
      </p>

      <ol className="mt-12 space-y-0">
        {steps.map((step, i) => (
          <li
            key={step.n}
            className={`relative grid gap-3 border-l-2 border-line pl-6 pb-10 sm:grid-cols-[auto_1fr] sm:gap-6 ${
              i === steps.length - 1 ? "pb-0" : ""
            }`}
          >
            <span className="absolute -left-[9px] top-0 flex h-4 w-4 items-center justify-center rounded-full border-2 border-ink bg-paper" />
            <span className="font-mono text-sm font-semibold text-ink/40">
              {step.n}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">{step.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/65">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 border border-line bg-sand/40 p-6 rounded-[var(--radius-xl)]">
        <p className="stamp text-ink/40">Next step</p>
        <h2 className="mt-1 text-base font-semibold text-ink">Siap belanja?</h2>
        <p className="mt-1 text-sm text-ink/60">
          Mulai dari katalog — atau baca FAQ jika masih ragu soal lisensi.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            href="/katalog"
            transitionTypes={["nav-forward"]}
            className="inline-flex h-10 items-center rounded-lg bg-ink px-4 text-sm font-medium text-paper hover:bg-ink/90"
          >
            Buka katalog
          </Link>
          <Link
            href="/bantuan"
            transitionTypes={["nav-forward"]}
            className="inline-flex h-10 items-center rounded-lg border border-line bg-paper px-4 text-sm font-medium text-ink hover:bg-sand/50"
          >
            FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}

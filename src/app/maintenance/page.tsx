import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mode Pemeliharaan",
  description: "Stackbay sedang dalam pemeliharaan sistem.",
};

export default function MaintenancePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center sm:py-24">
      <div className="surface p-8">
        <p className="stamp text-ink/40">SYSTEM MAINTENANCE</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          Toko Sedang Pemeliharaan
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/65">
          Kami sedang memperbarui sistem dan stok katalog. Silakan kembali beberapa saat lagi.
        </p>
        <div className="mt-6 pt-4 border-t border-line text-xs text-ink/45">
          Support WA 09–21 WIB · Stackbay Storefront
        </div>
      </div>
    </div>
  );
}

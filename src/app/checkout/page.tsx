import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Lengkapi data dan pilih metode bayar.",
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <header>
        <p className="stamp text-ink/45">Checkout · step 2</p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">
          Checkout
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ink/60">
          Isi data penerima lisensi. Setelah konfirmasi (demo), Anda mendapat
          nomor order SB-… dan instruksi aktivasi.
        </p>
      </header>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = {
  title: "Keranjang",
  description: "Tinjau lisensi yang akan Anda beli di Stackbay.",
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <header>
        <p className="stamp text-ink/45">Checkout · step 1</p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">
          Keranjang
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          Item disimpan di browser Anda. Lanjut checkout saat siap bayar.
        </p>
      </header>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}

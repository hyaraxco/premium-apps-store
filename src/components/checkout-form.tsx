"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { getProductById } from "@/lib/products";
import { formatIDR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { createOrderAction } from "@/app/checkout/actions";

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clear, hydrated } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<"bca" | "seabank" | "qris">("qris");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <div className="surface p-8 text-sm text-ink/50" role="status">
        Memuat checkout…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-line bg-sand/25 px-6 py-12 text-center sm:py-14 rounded-[var(--radius-xl)]">
        <p className="stamp text-ink/40">Checkout · kosong</p>
        <p className="mt-2 text-lg font-semibold tracking-tight text-ink">
          Tidak ada lisensi untuk dibayar
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink/60">
          Keranjang kosong. Tambahkan lisensi dulu dari katalog, lalu kembali ke
          checkout.
        </p>
        <Link
          href="/katalog"
          transitionTypes={["nav-back"]}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-ink px-5 text-sm font-medium text-paper hover:bg-ink/90"
        >
          Ke katalog
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const whatsapp = String(formData.get("whatsapp") ?? "").trim();

    const nextErr: Record<string, string> = {};
    if (!name) nextErr.name = "Nama wajib diisi";
    if (!email || !email.includes("@")) nextErr.email = "Email valid wajib diisi";

    if (Object.keys(nextErr).length > 0) {
      setErrors(nextErr);
      return;
    }

    setSubmitting(true);
    const res = await createOrderAction({
      buyerName: name,
      buyerEmail: email,
      buyerWhatsapp: whatsapp || undefined,
      paymentMethod,
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId || `${i.productId}-default`,
        months: i.months || 1,
        quantity: i.quantity,
      })),
    });

    if (!res.success) {
      setServerError(res.error || "Gagal memproses pesanan.");
      setSubmitting(false);
      return;
    }

    clear();
    const q = new URLSearchParams({ order: res.orderId });
    if (res.publicToken) q.set("token", res.publicToken);
    router.push(`/checkout/sukses?${q.toString()}`, {
      transitionTypes: ["nav-forward"],
    });
  }

  function handleClearErrors(e: React.FocusEvent<HTMLInputElement>) {
    if (errors[e.target.name]) {
      setErrors((err) => ({ ...err, [e.target.name]: "" }));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-8 lg:grid-cols-[1fr_320px] lg:gap-10"
    >
      <div className="space-y-6">
        <div className="surface p-6 sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            Informasi Pembeli
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            Akses lisensi dan tanda terima order akan dikirim ke email Anda.
          </p>

          <div className="mt-5 space-y-4">
            <Field
              id="name"
              label="Nama Lengkap"
              type="text"
              placeholder="e.g. Budi Santoso"
              error={errors.name}
              onFocus={handleClearErrors}
            />
            <Field
              id="email"
              label="Email (untuk penerimaan lisensi)"
              type="email"
              placeholder="e.g. budi@example.com"
              error={errors.email}
              onFocus={handleClearErrors}
            />
            <Field
              id="whatsapp"
              label="Nomor WhatsApp (opsional, untuk bantuan/klaim garansi)"
              type="tel"
              placeholder="e.g. 081234567890"
              onFocus={handleClearErrors}
            />
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="surface p-6 sm:p-7">
          <fieldset>
            <legend className="text-lg font-semibold tracking-tight text-ink">
              Metode Pembayaran
            </legend>
            <p className="mt-1 text-sm text-ink/60">
              Pilih metode pembayaran yang ingin Anda gunakan.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { id: "qris", title: "QRIS", desc: "Auto Nominal QR" },
                { id: "bca", title: "BCA", desc: "Transfer Bank" },
                { id: "seabank", title: "Seabank", desc: "Transfer Bank" },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`flex flex-col justify-between rounded-lg border p-3.5 cursor-pointer transition ${
                    paymentMethod === m.id
                      ? "border-ink bg-sand/30 font-semibold"
                      : "border-line bg-paper text-ink/70 hover:border-ink/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">{m.title}</span>
                    <input
                      type="radio"
                      name="payment-method"
                      value={m.id}
                      checked={paymentMethod === m.id}
                      onChange={() => setPaymentMethod(m.id as "bca" | "seabank" | "qris")}
                      className="accent-ink"
                    />
                  </div>
                  <span className="mt-2 text-xs font-normal text-ink/50">
                    {m.desc}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {serverError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            {serverError}
          </div>
        )}
      </div>

      <aside className="surface h-fit p-5">
        <p className="stamp text-ink/40">Item dalam order</p>
        <ul className="mt-3 divide-y divide-line border-b border-line pb-3">
          {items.map((item) => {
            const product = getProductById(item.productId);
            if (!product) return null;
            const itemMonths = item.months || 1;
            const itemPrice =
              (product.minPriceIDR || product.price || 0) * itemMonths * item.quantity;
            return (
              <li
                key={`${item.productId}-${item.variantId}`}
                className="flex justify-between gap-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-ink/70">
                  {product.name} ({itemMonths}m)
                  <span className="text-ink/40"> ×{item.quantity}</span>
                </span>
                <span className="shrink-0 tabular-nums font-medium">
                  {formatIDR(itemPrice)}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex justify-between text-base font-semibold">
          <span>Total Pembayaran</span>
          <span className="tabular-nums tracking-tight">
            {formatIDR(subtotal)}
          </span>
        </div>
        <Button
          type="submit"
          size="lg"
          className="mt-5 w-full"
          disabled={submitting}
        >
          {submitting ? "Memproses Order…" : "Bayar Sekarang"}
        </Button>
        <p className="mt-3 text-center text-xs leading-relaxed text-ink/45">
          Dengan melakukan order, Anda setuju dengan{" "}
          <Link
            href="/bantuan"
            transitionTypes={["nav-forward"]}
            className="underline hover:text-ink"
          >
            S&amp;K dan Ketentuan Garansi
          </Link>
          .
        </p>
      </aside>
    </form>
  );
}

function Field({
  id,
  label,
  type,
  placeholder,
  error,
  onFocus,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  error?: string;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        onFocus={onFocus}
        aria-invalid={!!error}
        aria-errormessage={error ? `${id}-error` : undefined}
        className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink aria-invalid:border-rose-500 aria-invalid:ring-rose-500"
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-rose-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

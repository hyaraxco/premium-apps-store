import type { BillingPeriod, ProductStatus } from "@/types/product";

export function formatIDR(amount?: number | null): string {
  if (amount == null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function billingLabel(billing?: BillingPeriod): string {
  if (!billing) return "per opsi";
  switch (billing) {
    case "monthly":
      return "per bulan";
    case "yearly":
      return "per tahun";
    case "lifetime":
      return "sekali bayar";
    default:
      return "per opsi";
  }
}

export function billingShort(billing?: BillingPeriod): string {
  if (!billing) return "";
  switch (billing) {
    case "monthly":
      return "/bln";
    case "yearly":
      return "/thn";
    case "lifetime":
      return "lifetime";
    default:
      return "";
  }
}

export function statusLabel(status: ProductStatus): string {
  switch (status) {
    case "available":
      return "Siap kirim";
    case "limited":
      return "Stok terbatas";
    case "preorder":
      return "Pre-order";
    case "out_of_stock":
      return "Stok habis";
    default:
      return "Tersedia";
  }
}

export function discountPercent(price?: number, original?: number): number | null {
  if (!price || !original || original <= price) return null;
  return Math.round(((original - price) / original) * 100);
}

export function sanitizeWaNumber(raw?: string | null): string {
  if (!raw) return "";
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (digits.startsWith("8")) {
    digits = "62" + digits;
  }
  return digits;
}

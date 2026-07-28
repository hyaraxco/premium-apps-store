import type { ProductVariant } from "@/types/product";

/**
 * Server-authoritative unit price for a line.
 * Monthly family: 1–11 = priceMonthly * months; 12 = promo priceIDR if isPromo.
 * Fixed variant: priceIDR as listed (ignore months multiplier when no monthly rate).
 */
export function unitPriceIdr(
  variant: Pick<
    ProductVariant,
    "priceIDR" | "priceMonthlyIDR" | "isPromo" | "durationMonths" | "durationDays"
  >,
  months: number,
): number {
  const m = Math.max(1, Math.floor(months));
  const monthly = variant.priceMonthlyIDR;

  if (monthly != null && monthly > 0) {
    if (m === 12 && variant.isPromo) {
      return variant.priceIDR;
    }
    return monthly * m;
  }

  // Fixed SKU (7d / 1m only / etc.)
  return variant.priceIDR;
}

export function lineSubtotalIdr(
  variant: Parameters<typeof unitPriceIdr>[0],
  months: number,
  qty: number,
): number {
  const q = Math.max(1, Math.floor(qty));
  return unitPriceIdr(variant, months) * q;
}

export function paymentTtlMs(method: "bca" | "seabank" | "qris"): number {
  if (method === "qris") return 10 * 60 * 1000;
  return 30 * 60 * 1000; // bank
}

export function paymentExpiresAt(
  method: "bca" | "seabank" | "qris",
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + paymentTtlMs(method));
}

/** Self-check: run with `npm exec tsx -- src/lib/pricing.selfcheck.ts` pattern via assert below */
export function pricingSelfCheck(): void {
  const monthly = {
    priceIDR: 55000,
    priceMonthlyIDR: 8000,
    isPromo: true,
    durationMonths: 1,
    durationDays: null as number | null,
  };
  if (unitPriceIdr(monthly, 1) !== 8000) throw new Error("1m price");
  if (unitPriceIdr(monthly, 3) !== 24000) throw new Error("3m price");
  if (unitPriceIdr(monthly, 12) !== 55000) throw new Error("12m promo");
  const fixed = {
    priceIDR: 15000,
    priceMonthlyIDR: null as number | null,
    isPromo: false,
    durationMonths: null as number | null,
    durationDays: 7,
  };
  if (unitPriceIdr(fixed, 1) !== 15000) throw new Error("fixed 7d");
  if (lineSubtotalIdr(monthly, 2, 2) !== 32000) throw new Error("line subtotal");
}

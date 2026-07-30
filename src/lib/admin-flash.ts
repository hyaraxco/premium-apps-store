import { redirect } from "next/navigation";

export type FlashKind = "ok" | "err";

/** Append flash query params and redirect (drops prior flash keys). */
export function redirectWithFlash(
  path: string,
  kind: FlashKind,
  message: string,
): never {
  const base = path.split("?")[0] ?? path;
  const params = new URLSearchParams();
  // preserve non-flash query if present
  const qIdx = path.indexOf("?");
  if (qIdx !== -1) {
    const existing = new URLSearchParams(path.slice(qIdx + 1));
    existing.forEach((v, k) => {
      if (k !== "flash" && k !== "msg") params.set(k, v);
    });
  }
  params.set("flash", kind);
  params.set("msg", message.slice(0, 200));
  redirect(`${base}?${params.toString()}`);
}

export function parseFlash(sp: {
  flash?: string;
  msg?: string;
}): { kind: FlashKind; message: string } | null {
  if (sp.flash !== "ok" && sp.flash !== "err") return null;
  const message = (sp.msg ?? "").trim();
  if (!message) return null;
  return { kind: sp.flash, message };
}

export const PAY_LABEL: Record<string, string> = {
  pending: "Menunggu bayar",
  paid: "Lunas",
  failed: "Gagal",
  cancelled: "Dibatalkan",
  refunded: "Refund",
  expired: "Kedaluwarsa",
};

export const FULFILL_LABEL: Record<string, string> = {
  pending: "Belum dikirim",
  partial: "Sebagian",
  fulfilled: "Selesai",
  failed: "Gagal kirim",
  revoked: "Dicabut",
};

export function payLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return PAY_LABEL[status] ?? status;
}

export function fulfillLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return FULFILL_LABEL[status] ?? status;
}

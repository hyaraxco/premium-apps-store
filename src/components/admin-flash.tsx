import Link from "next/link";
import { parseFlash, type FlashKind } from "@/lib/admin-flash";
import { cn } from "@/lib/utils";

/** Server banner from ?flash=ok|err&msg=… — strip link clears flash. */
export function AdminFlash({
  searchParams,
  clearHref,
}: {
  searchParams: { flash?: string; msg?: string; [k: string]: string | undefined };
  /** Path without flash params (e.g. /admin/order) */
  clearHref: string;
}) {
  const flash = parseFlash(searchParams);
  if (!flash) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
        flash.kind === "ok"
          ? "border-emerald-600/25 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
          : "border-rose-600/25 bg-rose-500/10 text-rose-950 dark:text-rose-100",
      )}
    >
      <div className="min-w-0">
        <p className="stamp opacity-60">
          {flash.kind === "ok" ? "Berhasil" : "Gagal"}
        </p>
        <p className="mt-0.5 font-medium leading-snug">{flash.message}</p>
      </div>
      <Link
        href={clearHref}
        className="shrink-0 text-xs font-medium opacity-60 hover:opacity-100"
        aria-label="Tutup notifikasi"
      >
        Tutup
      </Link>
    </div>
  );
}

export function flashTone(kind: FlashKind): string {
  return kind === "ok" ? "ok" : "err";
}

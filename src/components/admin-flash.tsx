"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { parseFlash, type FlashKind } from "@/lib/admin-flash";
import { cn } from "@/lib/utils";

export function AdminFlash({
  searchParams,
  clearHref,
}: {
  searchParams: { flash?: string; msg?: string; [k: string]: string | undefined };
  clearHref: string;
}) {
  const flash = parseFlash(searchParams);
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (flash) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        // Replace URL softly after fade out to clear flash query params
        setTimeout(() => router.replace(clearHref, { scroll: false }), 300);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [flash, clearHref, router]);

  if (!flash || !visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-auto flex w-full max-w-sm items-start gap-3 border border-line bg-paper px-3.5 py-3 shadow-[var(--shadow-lift)] rounded-[var(--radius-lg)] motion-safe:animate-[sb-toast-in_0.28s_ease-out]">
      <div className="min-w-0 flex-1">
        <p className="stamp text-ink/40">Notifikasi Admin</p>
        <p className={cn("mt-0.5 text-sm font-medium leading-snug", flash.kind === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400")}>
          {flash.kind === "ok" ? "Aksi Berhasil" : "Aksi Gagal"}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink/55">
          {flash.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          router.replace(clearHref, { scroll: false });
        }}
        className="shrink-0 text-xs font-medium text-ink/60 hover:text-ink"
        aria-label="Tutup notifikasi"
      >
        Tutup
      </button>
    </div>
  );
}

export function flashTone(kind: FlashKind): string {
  return kind === "ok" ? "ok" : "err";
}

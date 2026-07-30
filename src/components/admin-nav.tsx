"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { logoutAdminAction } from "@/app/admin/actions";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/admin/order", label: "Orders", match: (p: string) => p.startsWith("/admin/order") },
  { href: "/admin/produk", label: "Produk & Stok", match: (p: string) => p.startsWith("/admin/produk") },
  { href: "/admin/pengaturan", label: "Pengaturan", match: (p: string) => p.startsWith("/admin/pengaturan") },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link
            href="/admin/order"
            className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded bg-ink text-xs font-bold text-paper">
              Hx
            </span>
            <span className="truncate text-sm font-semibold text-ink">
              Admin
              <span className="ml-1.5 hidden font-normal text-ink/45 sm:inline">
                Hyarax Apps
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Admin">
            {links.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-sand text-ink"
                      : "text-ink/65 hover:bg-sand/60 hover:text-ink",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <Link
            href="/"
            className="hidden rounded-md px-2.5 py-1.5 text-xs font-medium text-ink/55 hover:bg-sand/60 hover:text-ink sm:inline"
          >
            Toko
          </Link>
          <form action={logoutAdminAction} className="hidden sm:block">
            <button
              type="submit"
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-ink/60 hover:bg-rose-500/10 hover:text-rose-700"
            >
              Keluar
            </button>
          </form>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink hover:bg-sand/50 md:hidden"
            aria-expanded={open}
            aria-controls="admin-mobile-nav"
            aria-label={open ? "Tutup menu admin" : "Buka menu admin"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div id="admin-mobile-nav" className="border-t border-line bg-paper md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-0.5 px-4 py-2.5 sm:px-6" aria-label="Admin mobile">
            {links.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm",
                    active ? "bg-sand font-medium text-ink" : "text-ink/75 hover:bg-sand/60",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="my-1.5 border-t border-line" />
            <Link
              href="/"
              className="rounded-lg px-3 py-2.5 text-sm text-ink/75 hover:bg-sand/60"
            >
              Kembali ke toko
            </Link>
            <form action={logoutAdminAction}>
              <button
                type="submit"
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-700 hover:bg-rose-500/10"
              >
                Keluar
              </button>
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}

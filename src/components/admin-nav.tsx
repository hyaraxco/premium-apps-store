"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { logoutAdminAction } from "@/app/admin/actions";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/admin", label: "Dashboard", match: (p: string) => p === "/admin" },
  { href: "/admin/order", label: "Orders", match: (p: string) => p.startsWith("/admin/order") },
  { href: "/admin/produk", label: "Produk & Stok", match: (p: string) => p.startsWith("/admin/produk") },
  { href: "/admin/pengaturan", label: "Pengaturan", match: (p: string) => p.startsWith("/admin/pengaturan") },
] as const;

export function AdminNav({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-line bg-paper/95 backdrop-blur md:flex md:flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-line px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-sm font-bold text-paper">Hx</span>
            <div>
              <p className="text-sm font-semibold text-ink">Hyarax Admin</p>
              <p className="stamp text-ink/40">Ops console</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4" aria-label="Admin">
          {links.map((item) => {
            const active = item.match(pathname);
            const isOrders = item.href === "/admin/order";
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-colors",
                  active ? "bg-ink text-paper" : "text-ink/70 hover:bg-sand/60 hover:text-ink",
                )}
                aria-current={active ? "page" : undefined}
              >
                <div className="flex items-center gap-2">
                  <span>{item.label}</span>
                  {isOrders && pendingCount > 0 && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:text-amber-100">
                      {pendingCount}
                    </span>
                  )}
                </div>
                {active ? <span className="stamp opacity-70">Active</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-line p-4">
          <div className="flex items-center justify-between rounded-xl border border-line bg-sand/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">Theme</p>
              <p className="stamp text-ink/45">light / dark</p>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex-1 rounded-xl border border-line px-4 py-3 text-sm text-ink/75 hover:bg-sand/60">
              Toko
            </Link>
            <form action={logoutAdminAction} className="flex-1">
              <button type="submit" className="w-full rounded-xl border border-line px-4 py-3 text-sm font-medium text-rose-700 hover:bg-rose-500/10">
                Keluar
              </button>
            </form>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur md:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-xs font-bold text-paper">Hx</span>
            <span className="text-sm font-semibold text-ink">Admin</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink"
              aria-expanded={open}
              aria-controls="admin-mobile-nav"
              aria-label={open ? "Tutup menu admin" : "Buka menu admin"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {open && (
          <div id="admin-mobile-nav" className="border-t border-line bg-paper">
            <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3" aria-label="Admin mobile">
              {links.map((item) => {
                const active = item.match(pathname);
                return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                      "rounded-xl px-4 py-3 text-sm",
                      active ? "bg-ink text-paper" : "text-ink/75 hover:bg-sand/60",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="my-2 border-t border-line" />
              <Link href="/" className="rounded-xl px-4 py-3 text-sm text-ink/75 hover:bg-sand/60">Toko</Link>
              <form action={logoutAdminAction}>
                <button type="submit" className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-rose-700 hover:bg-rose-500/10">
                  Keluar
                </button>
              </form>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

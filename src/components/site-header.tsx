"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/katalog", label: "Katalog" },
  { href: "/cara-kerja", label: "Cara kerja" },
  { href: "/bantuan", label: "Bantuan" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { count, hydrated } = useCart();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer on navigation. React-recommended "adjust state
  // during render" pattern (react.dev/learn/you-might-not-need-an-effect):
  // compares the previous pathname and resets during render instead of in an
  // effect, avoiding an extra cascade.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

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

  // Admin has its own chrome — avoid double sticky navbars
  if (pathname.startsWith("/admin")) return null;

  const isHome = pathname === "/";

  return (
    <header
      className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur-md transition-[background-color,border-color] duration-200"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-6 lg:gap-8">
          <Link
            href="/"
            transitionTypes={isHome ? undefined : ["nav-back"]}
            className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-[13px] font-bold tracking-tight text-paper transition-colors duration-200"
              aria-hidden
            >
              Hx
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-ink">
              Hyarax<span className="font-normal text-ink/70">Apps</span>
              <span className="stamp ml-1.5 hidden font-normal text-ink/40 sm:inline">
                by hyarax
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex" aria-label="Utama">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  transitionTypes={["nav-forward"]}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm transition-[background-color,color] duration-200 ease-out",
                    active
                      ? "bg-sand font-medium text-ink"
                      : "text-ink/65 hover:bg-sand/70 hover:text-ink",
                  )}
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
            href="/keranjang"
            transitionTypes={["nav-forward"]}
            className="relative inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-paper px-3 text-sm font-medium text-ink transition-[background-color,border-color,transform] duration-200 ease-out hover:bg-sand/50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/25 motion-reduce:active:scale-100 sm:px-3.5"
          >
            <CartIcon />
            <span className="hidden sm:inline">Keranjang</span>
            {hydrated && count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold tabular-nums text-paper">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink transition-[background-color,border-color] duration-200 hover:bg-sand/50 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Tutup menu" : "Buka menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile drawer — compact ops nav */}
      {open && (
        <div
          id="mobile-nav"
          className="border-t border-line bg-paper md:hidden"
        >
          <nav
            className="mx-auto flex max-w-6xl flex-col gap-0.5 px-4 py-2.5 sm:px-6"
            aria-label="Mobile"
          >
            <p className="stamp px-3 pb-1.5 pt-1 text-ink/35">Menu</p>
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  transitionTypes={["nav-forward"]}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm",
                    active
                      ? "bg-sand font-medium text-ink"
                      : "text-ink/75 hover:bg-sand/60",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="my-1.5 border-t border-line" />
            <Link
              href="/keranjang"
              transitionTypes={["nav-forward"]}
              className={cn(
                "rounded-lg px-3 py-2.5 text-sm",
                pathname === "/keranjang"
                  ? "bg-sand font-medium text-ink"
                  : "text-ink/75 hover:bg-sand/60",
              )}
            >
              Keranjang{hydrated && count > 0 ? ` · ${count}` : ""}
            </Link>
            <Link
              href="/checkout"
              transitionTypes={["nav-forward"]}
              className={cn(
                "rounded-lg px-3 py-2.5 text-sm",
                pathname.startsWith("/checkout")
                  ? "bg-sand font-medium text-ink"
                  : "text-ink/75 hover:bg-sand/60",
              )}
            >
              Checkout
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function CartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
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

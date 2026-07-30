"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer
      className="mt-auto border-t border-line bg-sand/30"
      style={{ viewTransitionName: "site-footer" }}
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-11 sm:px-6 md:grid-cols-4">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-[13px] font-bold text-paper">
              Hx
            </span>
            <span className="font-semibold text-ink">Premium Apps by Hyarax</span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink/60">
            Katalog curated untuk lisensi aplikasi premium &amp; subscription.
            Aktivasi digital, harga IDR transparan, support bahasa Indonesia.
          </p>
          <p className="stamp text-ink/35">
            Premium Apps by Hyarax · Digital Storefront
          </p>
        </div>

        <div>
          <h2 className="stamp font-semibold text-ink/45">Belanja</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/70">
            <li>
              <Link
                href="/katalog"
                transitionTypes={["nav-forward"]}
                className="hover:text-ink"
              >
                Semua aplikasi
              </Link>
            </li>
            <li>
              <Link
                href="/katalog?kategori=ai"
                transitionTypes={["nav-forward"]}
                className="hover:text-ink"
              >
                AI Tools
              </Link>
            </li>
            <li>
              <Link
                href="/katalog?kategori=developer"
                transitionTypes={["nav-forward"]}
                className="hover:text-ink"
              >
                Developer
              </Link>
            </li>
            <li>
              <Link
                href="/keranjang"
                transitionTypes={["nav-forward"]}
                className="hover:text-ink"
              >
                Keranjang
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="stamp font-semibold text-ink/45">Bantuan</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/70">
            <li>
              <Link
                href="/cara-kerja"
                transitionTypes={["nav-forward"]}
                className="hover:text-ink"
              >
                Cara kerja
              </Link>
            </li>
            <li>
              <Link
                href="/bantuan"
                transitionTypes={["nav-forward"]}
                className="hover:text-ink"
              >
                FAQ &amp; support
              </Link>
            </li>
            <li>
              <Link
                href="/checkout"
                transitionTypes={["nav-forward"]}
                className="hover:text-ink"
              >
                Checkout
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-ink/45 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Premium Apps by Hyarax.</p>
          <p>Harga IDR · Lisensi digital · Support 09–21 WIB</p>
        </div>
      </div>
    </footer>
  );
}

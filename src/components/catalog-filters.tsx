"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { categories } from "@/lib/products";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/types/product";

export function CatalogFilters({
  activeCategory,
  query,
}: {
  activeCategory: ProductCategory | "all";
  query: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (next: { kategori?: string; q?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.kategori !== undefined) {
        if (!next.kategori || next.kategori === "all") params.delete("kategori");
        else params.set("kategori", next.kategori);
      }
      if (next.q !== undefined) {
        if (!next.q.trim()) params.delete("q");
        else params.set("q", next.q.trim());
      }
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/katalog?${qs}` : "/katalog");
      });
    },
    [router, searchParams],
  );

  return (
    <div className={cn("space-y-4", pending && "opacity-70")}>
      <div className="relative">
        <label htmlFor="catalog-search" className="sr-only">
          Cari aplikasi
        </label>
        <input
          id="catalog-search"
          type="search"
          defaultValue={query}
          placeholder="Cari Notion, Figma, Copilot…"
          className="h-11 w-full rounded-lg border border-line bg-paper pl-11 pr-4 text-sm text-ink placeholder:text-ink/40 focus:border-ink/30 focus:outline-none focus:ring-2 focus:ring-ink/10"
          onChange={(e) => {
            const value = e.target.value;
            window.clearTimeout((window as unknown as { __sbSearch?: number }).__sbSearch);
            (window as unknown as { __sbSearch?: number }).__sbSearch = window.setTimeout(
              () => update({ q: value }),
              280,
            );
          }}
        />
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Filter kategori"
      >
        {categories.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => update({ kategori: cat.id })}
              className={cn(
                "stamp shrink-0 rounded-md border px-3 py-1.5 transition",
                active
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-paper text-ink/70 hover:border-ink/20 hover:bg-sand/50",
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

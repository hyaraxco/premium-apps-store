import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { CatalogFilters } from "@/components/catalog-filters";
import { categories } from "@/lib/products";
import { getProductsFromDb } from "@/db/queries";
import type { ProductCategory } from "@/types/product";

export const metadata: Metadata = {
  title: "Katalog",
  description: "Jelajahi semua aplikasi premium & subscription di Stackbay.",
};

function isCategory(value: string | undefined): value is ProductCategory | "all" {
  if (!value) return false;
  return categories.some((c) => c.id === value);
}

export default async function KatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; q?: string }>;
}) {
  const params = await searchParams;
  const kategori = isCategory(params.kategori) ? params.kategori : "all";
  const q = params.q?.trim().toLowerCase() ?? "";

  const allProducts = await getProductsFromDb();

  let list = allProducts;
  if (q) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }
  if (kategori !== "all") {
    list = list.filter((p) => p.category === kategori);
  }

  const categoryMeta = categories.find((c) => c.id === kategori);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="max-w-2xl">
        <p className="stamp text-ink/45">Katalog</p>
        <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-ink">
          {categoryMeta?.id === "all"
            ? "Semua aplikasi"
            : (categoryMeta?.label ?? "Katalog")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          {categoryMeta?.description ??
            "Filter & cari lisensi yang Anda butuhkan."}{" "}
          <span className="tabular-nums text-ink/80">
            {list.length} produk
          </span>
          {q ? (
            <>
              {" "}
              untuk “<span className="text-ink">{q}</span>”
            </>
          ) : null}
          .
        </p>
      </header>

      <div className="mt-7">
        <Suspense
          fallback={
            <div
              className="h-24 animate-pulse bg-sand/60 rounded-[var(--radius-xl)]"
              aria-hidden
            />
          }
        >
          <CatalogFilters activeCategory={kategori} query={q} />
        </Suspense>
      </div>

      {list.length === 0 ? (
        <div className="mt-9 border border-dashed border-line bg-sand/25 px-6 py-12 text-center sm:py-14 rounded-[var(--radius-xl)]">
          <p className="stamp text-ink/40">Katalog · kosong</p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-ink">
            Tidak ada lisensi cocok
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink/60">
            Coba kata kunci lain atau reset filter kategori.
          </p>
          <Link
            href="/katalog"
            transitionTypes={["nav-back"]}
            className="mt-5 inline-flex h-10 items-center rounded-lg border border-line bg-paper px-4 text-sm font-medium text-ink hover:bg-sand/40"
          >
            Reset filter
          </Link>
        </div>
      ) : (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

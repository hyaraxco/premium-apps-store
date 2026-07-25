import type { Metadata } from "next";
import { ViewTransition } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProductsFromDb,
  getProductBySlugFromDb,
  getRelatedProductsFromDb,
} from "@/db/queries";
import { categories } from "@/lib/products";
import { productVt } from "@/lib/view-transition";
import { Badge } from "@/components/ui/badge";
import { StatusMeta } from "@/components/status-meta";
import { PDPVariantSelector } from "@/components/pdp-variant-selector";
import { ProductCard } from "@/components/product-card";

export async function generateStaticParams() {
  const all = await getProductsFromDb();
  return all.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlugFromDb(slug);
  if (!product) return { title: "Produk tidak ditemukan" };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://apps.hyarax.works";

  return {
    title: `${product.name} — Lisensi & Langganan`,
    description: product.description,
    openGraph: {
      title: `${product.name} — Stackbay Storefront`,
      description: product.description,
      url: `${appUrl}/apps/${product.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlugFromDb(slug);
  if (!product) notFound();

  const related = await getRelatedProductsFromDb(product);
  const categoryLabel =
    categories.find((c) => c.id === product.category)?.label ?? product.category;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <ViewTransition enter="fade-in" default="none">
        <nav className="text-sm text-ink/50" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" transitionTypes={["nav-back"]} className="hover:text-ink">
                Beranda
              </Link>
            </li>
            <li aria-hidden className="text-ink/30">
              /
            </li>
            <li>
              <Link
                href="/katalog"
                transitionTypes={["nav-back"]}
                className="hover:text-ink"
              >
                Katalog
              </Link>
            </li>
            <li aria-hidden className="text-ink/30">
              /
            </li>
            <li className="font-medium text-ink/80">{product.name}</li>
          </ol>
        </nav>
      </ViewTransition>

      <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_min(100%,360px)] lg:gap-10">
        {/* Content second on mobile so buy box (aside) hits first */}
        <div className="min-w-0 order-2 lg:order-1">
          {/* Gallery hero — morphs from card media band */}
          <ViewTransition name={productVt.hero(product.id)} share="morph">
            <div
              className="relative overflow-hidden border border-line p-7 sm:p-9 rounded-[var(--radius-xl)]"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, ${product.accent} 14%, var(--paper)) 0%, var(--paper) 62%)`,
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <ViewTransition name={productVt.icon(product.id)} share="morph">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-lg text-2xl font-semibold text-white ring-1 ring-black/10 dark:ring-white/10"
                    style={{ backgroundColor: product.accent }}
                    aria-hidden
                  >
                    {product.icon}
                  </div>
                </ViewTransition>
                <StatusMeta status={product.status} />
              </div>
              <div className="mt-5 flex flex-wrap gap-1.5">
                <Badge tone="neutral">{categoryLabel}</Badge>
                {product.badge && <Badge tone="neutral">{product.badge}</Badge>}
                <Badge tone="neutral">
                  {product.fulfillmentType === "invite" ? "Invite Link" : "Credential"}
                </Badge>
              </div>
              <ViewTransition name={productVt.name(product.id)} share="morph">
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-[2.15rem]">
                  {product.name}
                </h1>
              </ViewTransition>
              <p className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-ink/65">
                {product.tagline || product.description}
              </p>
            </div>
          </ViewTransition>

          {/* Body arrives after hero morph */}
          <ViewTransition enter="slide-up" default="none">
            <div>
              <section className="mt-9">
                <h2 className="text-base font-semibold text-ink">
                  Deskripsi Produk
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-ink/70 sm:text-[15px]">
                  {product.longDescription}
                </p>
              </section>

              {product.sk && (
                <section className="mt-9">
                  <h2 className="text-base font-semibold text-ink">
                    Syarat &amp; Ketentuan
                  </h2>
                  <div className="mt-2.5 rounded-lg border border-line bg-paper p-4 text-sm leading-relaxed text-ink/80">
                    {product.sk}
                  </div>
                </section>
              )}

              {product.garansi && (
                <section className="mt-6">
                  <h2 className="text-base font-semibold text-ink">
                    Ketentuan Garansi
                  </h2>
                  <div className="mt-2.5 rounded-lg border border-line bg-sand/30 p-4 text-sm leading-relaxed text-ink/80">
                    {product.garansi}
                  </div>
                </section>
              )}

              <section className="mt-9 grid gap-3 sm:grid-cols-2">
                <div className="surface-muted p-4">
                  <h3 className="stamp text-ink/45">Fulfillment</h3>
                  <p className="mt-1.5 text-sm text-ink/80 font-medium">
                    {product.fulfillmentType === "invite"
                      ? "Akses Via Invite Link"
                      : "Akun Private / Sharing"}
                  </p>
                </div>
                <div className="surface-muted p-4">
                  <h3 className="stamp text-ink/45">Pengiriman</h3>
                  <p className="mt-1.5 text-sm text-ink/80">{product.delivery}</p>
                </div>
              </section>
            </div>
          </ViewTransition>
        </div>

        {/* Buy box — Variant Selector */}
        <aside className="surface order-1 h-fit min-w-0 lg:order-2 lg:sticky lg:top-20">
          <ViewTransition enter="slide-up" default="none">
            <PDPVariantSelector product={product} />
          </ViewTransition>
        </aside>
      </div>

      {related.length > 0 && (
        <ViewTransition enter="fade-in" default="none">
          <section className="mt-14 border-t border-line pt-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="stamp text-ink/40">Related</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  Mirip di {categoryLabel.toLowerCase()}
                </h2>
              </div>
              <Link
                href={`/katalog?kategori=${product.category}`}
                transitionTypes={["nav-back"]}
                className="text-sm font-medium text-ink/70 underline-offset-4 hover:text-ink hover:underline"
              >
                Semua di kategori
              </Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </ViewTransition>
      )}
    </div>
  );
}

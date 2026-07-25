import { ViewTransition } from "react";
import Link from "next/link";
import type { Product } from "@/types/product";
import { formatIDR } from "@/lib/format";
import { productVt } from "@/lib/view-transition";
import { Badge } from "@/components/ui/badge";
import { StatusMeta } from "@/components/status-meta";
import { categories } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const categoryLabel =
    categories.find((c) => c.id === product.category)?.label ?? product.category;

  const displayPrice = product.minPriceIDR ?? product.price ?? 0;
  const hasMultipleVariants = product.variants && product.variants.length > 1;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden border border-line bg-paper rounded-[var(--radius-xl)] transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-ink/20 hover:bg-sand/15 hover:shadow-[var(--shadow-lift)] motion-reduce:transition-colors motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none">
      <Link
        href={`/apps/${product.slug}`}
        transitionTypes={["nav-forward"]}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        {/* Gallery thumbnail → PDP hero */}
        <ViewTransition name={productVt.hero(product.id)} share="morph">
          <div
            className="relative flex h-32 items-end justify-between border-b border-line/70 px-5 pb-4 pt-5"
            style={{
              background: `linear-gradient(160deg, color-mix(in srgb, ${product.accent} 14%, var(--paper)) 0%, var(--paper) 70%)`,
            }}
          >
            <ViewTransition name={productVt.icon(product.id)} share="morph">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-semibold text-white ring-1 ring-black/10 dark:ring-white/10"
                style={{ backgroundColor: product.accent }}
                aria-hidden
              >
                {product.icon}
              </div>
            </ViewTransition>
            <div className="flex flex-col items-end gap-1">
              {product.badge && <Badge tone="neutral">{product.badge}</Badge>}
              <Badge tone="neutral">Stok {product.totalStock}</Badge>
            </div>
          </div>
        </ViewTransition>

        <div className="flex flex-1 flex-col gap-3 p-5 pt-4">
          <div className="space-y-1.5">
            <span className="stamp text-ink/45">{categoryLabel}</span>
            <ViewTransition name={productVt.name(product.id)} share="morph">
              <h3 className="text-[17px] font-semibold leading-snug tracking-tight text-ink transition-colors duration-200 group-hover:underline group-hover:decoration-ink/25 group-hover:underline-offset-4">
                {product.name}
              </h3>
            </ViewTransition>
            <p className="line-clamp-2 text-sm leading-relaxed text-ink/60">
              {product.tagline || product.description}
            </p>
          </div>

          <StatusMeta status={product.status} meta={product.delivery} />

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-line/80 pt-3.5">
            <div>
              <ViewTransition name={productVt.price(product.id)} share="morph">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs text-ink/45">Mulai</span>
                  <span className="text-lg font-semibold tabular-nums tracking-tight text-ink">
                    {formatIDR(displayPrice)}
                  </span>
                </div>
              </ViewTransition>
            </div>
            <div className="text-right text-xs text-ink/50">
              <span className="stamp text-ink/45 font-medium">
                {product.fulfillmentType === "invite" ? "Invite" : "Private/Sharing"}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

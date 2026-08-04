import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { StatusMeta } from "@/components/status-meta";
import { categories } from "@/lib/products";
import { formatIDR } from "@/lib/format";
import { getProductsFromDb } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dbProducts = await getProductsFromDb();
  const featured = dbProducts.slice(0, 6);
  const lowest =
    dbProducts.length === 0
      ? 0
      : Math.min(...dbProducts.map((p) => p.minPriceIDR || p.price || 0));
  const readyCount = dbProducts.filter((p) => p.status === "available").length;

  if (dbProducts.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-18">
        <div className="border border-dashed border-line bg-sand/25 px-6 py-12 text-center sm:py-14 rounded-[var(--radius-xl)]">
          <p className="stamp text-ink/40">Katalog · kosong</p>
          <p className="mt-2 text-lg font-semibold tracking-tight text-ink">
            Belum ada lisensi tersedia
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink/60">
            Katalog sedang dikosongkan. Cek kembali nanti.
          </p>
          <Link
            href="/cara-kerja"
            transitionTypes={["nav-forward"]}
            className="mt-5 inline-flex h-10 items-center rounded-lg border border-line bg-paper px-4 text-sm font-medium text-ink hover:bg-sand/40"
          >
            Cara aktivasi
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero — left-weighted editorial, not centered SaaS template */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #c4b8a8 1px, transparent 0)",
            backgroundSize: "22px 22px",
            maskImage:
              "linear-gradient(to bottom, black 35%, transparent 95%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-12 lg:py-20">
          {/* min-w-0: grid items default min-width:auto was clipping hero on ~375px */}
          <div className="min-w-0">
            <p className="stamp inline-flex items-center gap-2 rounded-md border border-line bg-paper/90 px-2.5 py-1 text-ink/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden />
              {readyCount} siap kirim · {dbProducts.length} di katalog
            </p>
            <h1 className="mt-5 w-full max-w-xl text-[2rem] font-semibold leading-[1.12] tracking-tight text-ink sm:text-5xl sm:leading-[1.06]">
              Lisensi premium &amp; subscription, siap pakai.
            </h1>
            <p className="mt-4 w-full max-w-lg text-[15px] leading-relaxed text-ink/65 sm:text-base">
              Hyarax Apps mengkurasi app untuk creator, developer, dan tim kecil.
              Harga Rupiah, status stok (siap kirim / terbatas / pre-order),
              aktivasi digital ke email Anda.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link
                href="/katalog"
                transitionTypes={["nav-forward"]}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-ink px-5 text-sm font-medium text-paper transition hover:bg-ink/90"
              >
                Lihat katalog
              </Link>
              <Link
                href="/cara-kerja"
                transitionTypes={["nav-forward"]}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-paper px-5 text-sm font-medium text-ink transition hover:bg-sand/50"
              >
                Cara aktivasi
              </Link>
            </div>
            <dl className="mt-9 grid max-w-md grid-cols-3 gap-3 border-t border-line pt-5">
              <div>
                <dt className="stamp text-ink/40">Mulai dari</dt>
                <dd className="mt-1 text-sm font-semibold tabular-nums text-ink">
                  {formatIDR(lowest)}
                </dd>
              </div>
              <div>
                <dt className="stamp text-ink/40">Stack</dt>
                <dd className="mt-1 text-sm font-semibold text-ink">
                  {categories.length - 1} kategori
                </dd>
              </div>
              <div>
                <dt className="stamp text-ink/40">Dukungan</dt>
                <dd className="mt-1 text-sm font-semibold text-ink">09–21 WIB</dd>
              </div>
            </dl>
          </div>

          {/* Live demand strip — product-specific, not fake metrics */}
          <div className="relative min-w-0">
            <div className="overflow-hidden border border-line bg-paper rounded-[var(--radius-xl)]">
              <div className="flex items-center justify-between gap-2 border-b border-line bg-sand/40 px-4 py-2.5">
                <span className="stamp text-ink/50">Sedang dicari</span>
                <span className="stamp shrink-0 text-ink/40">Harga IDR</span>
              </div>
              <ul className="divide-y divide-line">
                {featured.slice(0, 4).map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/apps/${p.slug}`}
                      transitionTypes={["nav-forward"]}
                      className="flex min-w-0 items-center gap-3 px-4 py-3 transition hover:bg-sand/35"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                        style={{ backgroundColor: p.accent }}
                        aria-hidden
                      >
                        {p.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">
                          {p.name}
                        </span>
                        <StatusMeta
                          status={p.status}
                          meta={p.delivery.split("·")[0]?.trim()}
                          className="mt-0.5"
                        />
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                        {formatIDR(p.minPriceIDR || p.price || 0)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog highlight grid */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-18">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="stamp text-ink/40">Pilihan minggu ini</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Lisensi siap kirim
            </h2>
          </div>
          <Link
            href="/katalog"
            transitionTypes={["nav-forward"]}
            className="text-sm font-medium text-ink underline-offset-4 hover:underline"
          >
            Lihat semua →
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Domain categories overview */}
      <section className="border-t border-line bg-sand/30 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="stamp text-ink/40">Kategori</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                Berdasarkan kebutuhan tim
              </h2>
            </div>
            <Link
              href="/katalog"
              transitionTypes={["nav-forward"]}
              className="text-sm font-medium text-ink/70 underline-offset-4 hover:text-ink hover:underline"
            >
              Semua app
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories
              .filter((c) => c.id !== "all")
              .map((cat) => (
                <Link
                  key={cat.id}
                  href={`/katalog?kategori=${cat.id}`}
                  transitionTypes={["nav-forward"]}
                  className="rounded-lg border border-line bg-paper p-3.5 transition-colors hover:border-ink/20 hover:bg-sand/30"
                >
                  <p className="stamp text-ink/40">{cat.label}</p>
                  <p className="mt-1 text-[15px] font-semibold text-ink">
                    {cat.description}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}

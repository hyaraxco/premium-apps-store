import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:py-24">
      <div className="border border-line bg-paper px-6 py-10 text-center rounded-[var(--radius-xl)]">
        <p className="stamp text-ink/40">404 · not found</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          Halaman tidak ada
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Link rusak, slug salah, atau lisensi sudah dihapus dari katalog.
        </p>
        <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href="/katalog"
            transitionTypes={["nav-back"]}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-ink px-5 text-sm font-medium text-paper hover:bg-ink/90"
          >
            Ke katalog
          </Link>
          <Link
            href="/"
            transitionTypes={["nav-back"]}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-paper px-5 text-sm font-medium text-ink hover:bg-sand/50"
          >
            Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6" aria-busy="true" aria-label="Memuat panel admin">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-md bg-sand/80" />
        <div className="h-3 w-64 animate-pulse rounded bg-sand/50" />
      </div>
      <div className="surface overflow-hidden">
        <div className="border-b border-line bg-sand/30 px-4 py-3">
          <div className="flex gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-3 w-16 animate-pulse rounded bg-sand/70" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="h-4 w-24 animate-pulse rounded bg-sand/60" />
              <div className="h-4 flex-1 animate-pulse rounded bg-sand/40" />
              <div className="h-4 w-16 animate-pulse rounded bg-sand/50" />
              <div className="h-7 w-20 animate-pulse rounded-md bg-sand/70" />
            </div>
          ))}
        </div>
      </div>
      <p className="stamp text-center text-ink/35">Memuat data operator…</p>
    </div>
  );
}

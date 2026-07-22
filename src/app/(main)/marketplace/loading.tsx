export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8 h-9 w-56 animate-pulse rounded bg-muted" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-4">
          <div className="h-8 animate-pulse rounded-full bg-muted" />
          <div className="h-16 animate-pulse rounded bg-muted" />
          <div className="h-8 animate-pulse rounded-full bg-muted" />
          <div className="h-8 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </aside>

        <div>
          <div className="mb-4 h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

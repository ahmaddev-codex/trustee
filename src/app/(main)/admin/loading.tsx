export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-6 sm:px-6 sm:py-8">
      <div className="h-8 w-32 animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

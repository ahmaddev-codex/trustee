// Full-page transition for moments with a real wait on another system
// (Monnify hand-off, auth) - not ordinary route loads (those use loading.tsx).
export function BrandLoader({ message }: { message?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[var(--brand-deep)] text-white">
      <div className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
        <span className="size-2 rounded-full bg-lime" aria-hidden />
        Trustee
      </div>
      <span className="brand-loader" aria-hidden />
      {message && <p className="text-sm text-white/70">{message}</p>}
    </div>
  );
}

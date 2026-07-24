import { PageContainer } from "@/components/page-container";

export default function Loading() {
  return (
    <PageContainer className="py-6 sm:py-8">
      <div className="mb-6 h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="mb-4 h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </PageContainer>
  );
}

import { PageContainer } from "@/components/page-container";

export default function Loading() {
  return (
    <PageContainer className="py-6 sm:py-8">
      <div className="mb-6 h-8 w-2/3 animate-pulse rounded bg-muted" />
      <div className="mb-6 h-12 animate-pulse rounded bg-muted" />
      <div className="h-48 animate-pulse rounded-2xl bg-muted" />
    </PageContainer>
  );
}

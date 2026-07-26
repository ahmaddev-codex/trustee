"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TbAlertTriangle } from "react-icons/tb";

import { Button } from "@/components/ui/button";

export default function MainError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <TbAlertTriangle className="mb-4 size-8 text-destructive" />
      <h1 className="font-display text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn&apos;t load this page. This is usually temporary - try again in a moment.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => unstable_retry()}>Try again</Button>
        <Button variant="outline" render={<Link href="/" />}>
          Go home
        </Button>
      </div>
    </div>
  );
}

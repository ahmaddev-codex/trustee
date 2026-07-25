"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { BrandLoader } from "@/components/brand-loader";

// Monnify's checkout page is served from *.monnify.com — the only thing
// stopping ?url= from becoming an open redirect.
function isTrustedCheckoutUrl(value: string): boolean {
  try {
    const { protocol, hostname } = new URL(value);
    return protocol === "https:" && (hostname === "monnify.com" || hostname.endsWith(".monnify.com"));
  } catch {
    return false;
  }
}

function CheckoutRedirect() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const valid = Boolean(url && isTrustedCheckoutUrl(url));

  useEffect(() => {
    if (valid && url) {
      window.location.href = url;
    }
  }, [valid, url]);

  if (!valid) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--brand-deep)] px-4 text-center text-white">
        <p>We couldn&apos;t verify this checkout link.</p>
        <Link href="/marketplace" className="underline underline-offset-4">
          Back to the marketplace
        </Link>
      </div>
    );
  }

  return <BrandLoader message="Redirecting you to Monnify to complete payment…" />;
}

export default function CheckoutRedirectPage() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <CheckoutRedirect />
    </Suspense>
  );
}

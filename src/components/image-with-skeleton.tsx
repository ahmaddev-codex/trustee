"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

// Fills its (relatively-positioned) parent, same as a bare `<Image fill />>`,
// but shows a pulsing placeholder until the image actually finishes loading.
export function ImageWithSkeleton({
  src,
  alt,
  sizes = "100vw",
  className,
}: {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <div className="absolute inset-0 bg-muted skeleton-shimmer" />}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        unoptimized
        onLoad={() => setLoaded(true)}
        className={cn(
          "object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </>
  );
}

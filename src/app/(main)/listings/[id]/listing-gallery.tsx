"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { ImageWithSkeleton } from "@/components/image-with-skeleton";

export function ListingGallery({ imageUrls, title }: { imageUrls: string[]; title: string }) {
  const [selected, setSelected] = useState(0);

  return (
    <div className="flex gap-3">
      <div className="relative h-[420px] flex-1 overflow-hidden rounded-lg border">
        <ImageWithSkeleton key={selected} src={imageUrls[selected]} alt={title} />
      </div>
      {imageUrls.length > 1 && (
        <div className="scrollbar-hide flex h-[420px] w-24 shrink-0 flex-col gap-2 overflow-y-auto">
          {imageUrls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`View photo ${i + 1}`}
              className={cn(
                "relative aspect-square w-full shrink-0 overflow-hidden rounded-lg border",
                i === selected && "ring-2 ring-primary ring-offset-1",
              )}
            >
              <ImageWithSkeleton src={url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

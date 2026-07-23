"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { ImageWithSkeleton } from "@/components/image-with-skeleton";

export function ListingGallery({ imageUrls, title }: { imageUrls: string[]; title: string }) {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border">
        <ImageWithSkeleton key={selected} src={imageUrls[selected]} alt={title} />
      </div>
      {imageUrls.length > 1 && (
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {imageUrls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`View photo ${i + 1}`}
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border",
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

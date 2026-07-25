"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

import { Dialog, DialogContent } from "@/components/ui/dialog";

// Wraps the intercepted /listings/[id] route as an overlay on the page it
// was opened from. Closing funnels through router.back() to restore it.
export function ListingModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent
        ref={contentRef}
        // Base UI's default focus lands on the Buy button near the bottom, dragging
        // content down — focus the container itself so listings open scrolled to top.
        initialFocus={contentRef}
        className="sm:max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

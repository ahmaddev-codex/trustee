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
        // Base UI's default initial focus lands on the first tabbable element
        // inside the popup — for a single-image listing that's the Buy button
        // near the bottom, which drags the scrollable content down with it.
        // Focus the (non-scrolling) container itself so listings always open
        // scrolled to the top.
        initialFocus={contentRef}
        className="sm:max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

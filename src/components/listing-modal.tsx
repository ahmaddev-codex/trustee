"use client";

import { useRouter } from "next/navigation";

import { Dialog, DialogContent } from "@/components/ui/dialog";

// Wraps the intercepted /listings/[id] route as an overlay on the page it
// was opened from. Closing funnels through router.back() to restore it.
export function ListingModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        {children}
      </DialogContent>
    </Dialog>
  );
}

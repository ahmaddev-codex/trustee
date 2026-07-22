"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { apiFetch } from "@/lib/api";

export function ModerateListingForm({ listingId }: { listingId: string }) {
  const router = useRouter();

  const moderate = useMutation({
    mutationFn: (action: "DISMISS" | "REMOVE") =>
      apiFetch<{ ok: boolean }>(`/api/admin/listings/${listingId}/moderate`, {
        method: "POST",
        body: JSON.stringify({ action }),
      }),
    onSuccess: (_data, action) => {
      toast.success(action === "REMOVE" ? "Listing removed" : "Flag dismissed");
      router.refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => moderate.mutate("DISMISS")}
        disabled={moderate.isPending}
      >
        Dismiss flag
      </Button>
      <ConfirmActionDialog
        trigger="Remove listing"
        triggerVariant="destructive"
        triggerSize="sm"
        title="Remove this listing?"
        description="This takes the listing down immediately. It can't be undone from here."
        confirmLabel="Remove listing"
        confirmVariant="destructive"
        isPending={moderate.isPending}
        onConfirm={() => moderate.mutate("REMOVE")}
      />
    </div>
  );
}

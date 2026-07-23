"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { apiFetch } from "@/lib/api";

export function ManageListingActions({
  listingId,
  status,
}: {
  listingId: string;
  status: "ACTIVE" | "REMOVED";
}) {
  const router = useRouter();

  const delist = useMutation({
    mutationFn: () => apiFetch(`/api/listings/${listingId}/delist`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Listing delisted");
      router.refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delist listing"),
  });

  const relist = useMutation({
    mutationFn: () => apiFetch(`/api/listings/${listingId}/relist`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Listing relisted");
      router.refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not relist listing"),
  });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="flex-1 text-sm text-muted-foreground">
        {status === "ACTIVE"
          ? "This is your listing — it's live on the marketplace."
          : "This listing is delisted — buyers can't see or buy it."}
      </p>
      <Button variant="outline" size="sm" render={<Link href={`/listings/${listingId}/edit`} />}>
        Edit
      </Button>
      {status === "ACTIVE" ? (
        <ConfirmActionDialog
          trigger="Delist"
          triggerVariant="destructive"
          triggerSize="sm"
          title="Delist this listing?"
          description="Buyers won't be able to see or buy it anymore. You can relist it later."
          confirmLabel="Delist listing"
          confirmVariant="destructive"
          isPending={delist.isPending}
          onConfirm={() => delist.mutate()}
        />
      ) : (
        <Button size="sm" onClick={() => relist.mutate()} disabled={relist.isPending}>
          {relist.isPending ? "Relisting…" : "Relist"}
        </Button>
      )}
    </div>
  );
}

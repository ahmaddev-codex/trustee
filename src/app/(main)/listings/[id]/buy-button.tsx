"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { apiFetch } from "@/lib/api";

export function BuyButton({
  listingId,
  isAuthed,
  itemPriceLabel,
  platformFeeLabel,
}: {
  listingId: string;
  isAuthed: boolean;
  itemPriceLabel: string;
  platformFeeLabel: string;
}) {
  const router = useRouter();

  const buy = useMutation({
    mutationFn: () =>
      apiFetch<{ order: { id: string }; checkoutUrl: string }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({ listingId }),
      }),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not start checkout");
    },
  });

  if (!isAuthed) {
    return (
      <Button onClick={() => router.push(`/login?callbackUrl=/listings/${listingId}`)}>
        Log in to buy
      </Button>
    );
  }

  return (
    <ConfirmActionDialog
      trigger={buy.isPending ? "Starting checkout…" : "Buy now"}
      triggerDisabled={buy.isPending}
      title="Confirm your purchase"
      description="You'll be sent to Monnify to complete payment. Funds stay in escrow until you confirm the item arrived."
      confirmLabel="Continue to payment"
      isPending={buy.isPending}
      onConfirm={() => buy.mutate()}
      content={
        <dl className="space-y-2 rounded-lg border p-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Item price</dt>
            <dd className="font-display font-medium">{itemPriceLabel}</dd>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <dt>Platform fee (deducted from seller&apos;s payout)</dt>
            <dd className="font-display">{platformFeeLabel}</dd>
          </div>
          <div className="flex items-center justify-between border-t pt-2 font-semibold">
            <dt>You pay today</dt>
            <dd className="font-display">{itemPriceLabel}</dd>
          </div>
        </dl>
      }
    />
  );
}

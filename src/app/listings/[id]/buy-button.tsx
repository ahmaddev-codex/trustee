"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

export function BuyButton({
  listingId,
  isAuthed,
}: {
  listingId: string;
  isAuthed: boolean;
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
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Log in to buy this item — your payment is held in escrow until you
          confirm receipt.
        </p>
        <Button onClick={() => router.push(`/login?callbackUrl=/listings/${listingId}`)}>
          Log in to buy
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Your payment is held in escrow until you confirm the item arrived.
      </p>
      <Button onClick={() => buy.mutate()} disabled={buy.isPending}>
        {buy.isPending ? "Starting checkout…" : "Buy — pay into escrow"}
      </Button>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { TbSparkles } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { apiFetch } from "@/lib/api";

type DisputeSuggestion = {
  suggestion: "RELEASE" | "REFUND" | "UNCLEAR";
  reasoning: string;
};

export function ResolveDisputeForm({ disputeId }: { disputeId: string }) {
  const router = useRouter();

  const resolve = useMutation({
    mutationFn: (resolution: "RELEASE" | "REFUND") =>
      apiFetch<{ pendingAuthorization?: boolean }>(`/api/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ resolution }),
      }),
    onSuccess: (data) => {
      toast.success(
        data.pendingAuthorization
          ? "Transfer started — authorize it below once the OTP arrives"
          : "Dispute resolved",
      );
      router.refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const analyze = useMutation({
    mutationFn: () =>
      apiFetch<DisputeSuggestion>(`/api/admin/disputes/${disputeId}/analyze`, {
        method: "POST",
      }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="space-y-2">
      {analyze.data && (
        <p className="rounded-lg border bg-accent/40 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            AI suggests: {analyze.data.suggestion}.
          </span>{" "}
          {analyze.data.reasoning}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <ConfirmActionDialog
          trigger="Release to seller"
          triggerSize="sm"
          title="Release funds to the seller?"
          description="This resolves the dispute in the seller's favor and sends the payout immediately. This can't be undone."
          confirmLabel="Release funds"
          isPending={resolve.isPending}
          onConfirm={() => resolve.mutate("RELEASE")}
        />
        <ConfirmActionDialog
          trigger="Refund buyer"
          triggerVariant="outline"
          triggerSize="sm"
          title="Refund the buyer?"
          description="This resolves the dispute in the buyer's favor and refunds their payment in full. This can't be undone."
          confirmLabel="Refund buyer"
          isPending={resolve.isPending}
          onConfirm={() => resolve.mutate("REFUND")}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => analyze.mutate()}
          disabled={analyze.isPending}
        >
          <TbSparkles className="size-3.5" />
          {analyze.isPending ? "Thinking…" : "Get AI take"}
        </Button>
      </div>
    </div>
  );
}

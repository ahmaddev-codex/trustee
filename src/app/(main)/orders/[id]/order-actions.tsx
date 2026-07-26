"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { apiFetch } from "@/lib/api";

export function OrderActions({
  orderId,
  status,
  isBuyer,
  isSeller,
}: {
  orderId: string;
  status: string;
  isBuyer: boolean;
  isSeller: boolean;
}) {
  const router = useRouter();
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reason, setReason] = useState("");

  const post = (path: string, body?: unknown) =>
    apiFetch<{ error?: string; pendingAuthorization?: boolean }>(
      `/api/orders/${orderId}/${path}`,
      { method: "POST", body: body ? JSON.stringify(body) : undefined },
    );

  const ship = useMutation({
    mutationFn: () => post("ship"),
    onSuccess: () => {
      toast.success("Marked as shipped");
      router.refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const confirmReceipt = useMutation({
    mutationFn: () => post("confirm-receipt"),
    onSuccess: (data) => {
      if (data.pendingAuthorization) {
        toast.success("Payout started", { description: "Awaiting authorization." });
      } else {
        toast.success("Payout released to the seller");
      }
      router.refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const requestRefund = useMutation({
    mutationFn: () => post("refund-request"),
    onSuccess: (data) => {
      if (data.pendingAuthorization) {
        toast.success("Refund started", { description: "Awaiting authorization." });
      } else {
        toast.success("Refund sent");
      }
      router.refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const raiseDispute = useMutation({
    mutationFn: () => post("dispute", { reason }),
    onSuccess: () => {
      toast.success("Dispute raised", { description: "Our team will review it." });
      router.refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (status === "AWAITING_PAYMENT" && isBuyer) {
    return (
      <Button variant="outline" onClick={() => router.refresh()}>
        I&apos;ve paid - check status
      </Button>
    );
  }

  if (status === "FUNDED") {
    if (isSeller) {
      return (
        <Button onClick={() => ship.mutate()} disabled={ship.isPending}>
          {ship.isPending ? "Marking as shipped…" : "Mark as shipped"}
        </Button>
      );
    }
    if (isBuyer) {
      return (
        <div className="flex flex-wrap gap-2">
          <ConfirmActionDialog
            trigger="Request a refund"
            triggerVariant="outline"
            title="Request a refund?"
            description="The seller hasn't shipped yet. We'll refund your payment in full - this can't be undone."
            confirmLabel="Request refund"
            isPending={requestRefund.isPending}
            onConfirm={() => requestRefund.mutate()}
          />
        </div>
      );
    }
  }

  if (status === "SHIPPED" && isBuyer) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <ConfirmActionDialog
            trigger={confirmReceipt.isPending ? "Releasing…" : "Confirm receipt"}
            title="Confirm receipt?"
            description="This releases the funds to the seller right away. Only confirm once you've checked the item and you're happy with it - this can't be undone."
            confirmLabel="Confirm & release funds"
            isPending={confirmReceipt.isPending}
            onConfirm={() => confirmReceipt.mutate()}
          />
          <Button variant="outline" onClick={() => setDisputeOpen((v) => !v)}>
            Report a problem
          </Button>
        </div>
        {disputeOpen && (
          <div className="space-y-2">
            <Textarea
              placeholder="What went wrong?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <Button
              variant="destructive"
              size="sm"
              onClick={() => raiseDispute.mutate()}
              disabled={raiseDispute.isPending || reason.trim().length < 5}
            >
              Submit dispute
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

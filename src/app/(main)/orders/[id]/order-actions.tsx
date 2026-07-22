"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
      toast.success(
        data.pendingAuthorization
          ? "Payout started — awaiting authorization"
          : "Payout released to the seller",
      );
      router.refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const requestRefund = useMutation({
    mutationFn: () => post("refund-request"),
    onSuccess: (data) => {
      toast.success(
        data.pendingAuthorization ? "Refund started — awaiting authorization" : "Refund sent",
      );
      router.refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const raiseDispute = useMutation({
    mutationFn: () => post("dispute", { reason }),
    onSuccess: () => {
      toast.success("Dispute raised — our team will review it");
      router.refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  if (status === "AWAITING_PAYMENT" && isBuyer) {
    return (
      <Button variant="outline" onClick={() => router.refresh()}>
        I&apos;ve paid — check status
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
          <Button
            variant="outline"
            onClick={() => requestRefund.mutate()}
            disabled={requestRefund.isPending}
          >
            {requestRefund.isPending ? "Requesting…" : "Request a refund"}
          </Button>
        </div>
      );
    }
  }

  if (status === "SHIPPED" && isBuyer) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => confirmReceipt.mutate()} disabled={confirmReceipt.isPending}>
            {confirmReceipt.isPending ? "Releasing…" : "Confirm receipt"}
          </Button>
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

"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

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

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => resolve.mutate("RELEASE")}
        disabled={resolve.isPending}
      >
        Release to seller
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => resolve.mutate("REFUND")}
        disabled={resolve.isPending}
      >
        Refund buyer
      </Button>
    </div>
  );
}

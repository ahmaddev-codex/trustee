"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

export function AuthorizeForm({ reference }: { reference: string }) {
  const router = useRouter();
  const [otp, setOtp] = useState("");

  const authorize = useMutation({
    mutationFn: () =>
      apiFetch(`/api/admin/disbursements/${reference}/authorize`, {
        method: "POST",
        body: JSON.stringify({ otp }),
      }),
    onSuccess: () => {
      toast.success("Transfer authorized");
      router.refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not authorize"),
  });

  return (
    <div className="flex gap-2">
      <Input
        placeholder="OTP from Monnify email"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />
      <Button onClick={() => authorize.mutate()} disabled={!otp || authorize.isPending}>
        {authorize.isPending ? "Authorizing…" : "Authorize"}
      </Button>
    </div>
  );
}

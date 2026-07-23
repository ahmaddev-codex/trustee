"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { TbCircleCheck } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

interface Bank {
  name: string;
  code: string;
}

interface SavedBankDetails {
  bankAccountNumber: string | null;
  bankCode: string | null;
  bankAccountName: string | null;
}

// Extracted from the old standalone /profile/bank-details page so it can
// render inline as a dashboard tab instead.
export function PayoutDetailsForm() {
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);

  const { data: banks, isLoading: loadingBanks } = useQuery({
    queryKey: queryKeys.monnify.banks(),
    queryFn: () => apiFetch<{ banks: Bank[] }>("/api/monnify/banks").then((r) => r.banks),
  });

  const { data: saved } = useQuery({
    queryKey: queryKeys.profile.bankDetails(),
    queryFn: () => apiFetch<SavedBankDetails>("/api/profile/bank-details"),
  });

  // Seed the form from the saved account once, the first render after it loads —
  // React's documented pattern for adjusting state from external data without an effect.
  if (saved && !seeded) {
    setSeeded(true);
    if (saved.bankCode) setBankCode(saved.bankCode);
    if (saved.bankAccountNumber) setAccountNumber(saved.bankAccountNumber);
    if (saved.bankAccountName) setVerifiedName(saved.bankAccountName);
  }

  const verify = useMutation({
    mutationFn: () =>
      apiFetch<{ accountName: string }>("/api/profile/bank-details", {
        method: "POST",
        body: JSON.stringify({ accountNumber, bankCode }),
      }),
    onSuccess: (data) => {
      setVerifiedName(data.accountName);
      toast.success("Bank account verified and saved");
    },
    onError: (error) => {
      setVerifiedName(null);
      toast.error(error instanceof Error ? error.message : "Could not verify account");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">Payout bank account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          We verify this account with Monnify before saving it, so payouts never go to the wrong
          place.
        </p>

        <div className="space-y-1.5">
          <Label>Bank</Label>
          <Combobox
            options={(banks ?? []).map((bank) => ({ value: bank.code, label: bank.name }))}
            value={bankCode}
            onChange={(value) => {
              setBankCode(value);
              setVerifiedName(null);
            }}
            disabled={loadingBanks}
            placeholder={loadingBanks ? "Loading banks…" : "Select your bank"}
            searchPlaceholder="Search banks…"
            emptyText="No banks found."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="accountNumber">Account number</Label>
          <Input
            id="accountNumber"
            inputMode="numeric"
            maxLength={10}
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value.replace(/\D/g, ""));
              setVerifiedName(null);
            }}
          />
        </div>

        {verifiedName && (
          <div className="flex items-start gap-2 rounded-lg border bg-accent/50 p-3 text-sm">
            <TbCircleCheck className="mt-0.5 size-4 shrink-0 text-brand" />
            <span>
              Payout account on file: <span className="font-medium">{verifiedName}</span>
            </span>
          </div>
        )}

        <Button
          className="w-full"
          disabled={!bankCode || accountNumber.length !== 10 || verify.isPending}
          onClick={() => verify.mutate()}
        >
          {verify.isPending ? "Verifying…" : verifiedName ? "Update bank account" : "Verify and save"}
        </Button>
      </CardContent>
    </Card>
  );
}

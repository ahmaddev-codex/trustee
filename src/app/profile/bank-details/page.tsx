"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

interface Bank {
  name: string;
  code: string;
}

export default function BankDetailsPage() {
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [verifiedName, setVerifiedName] = useState<string | null>(null);

  const { data: banks, isLoading: loadingBanks } = useQuery({
    queryKey: ["monnify", "banks"],
    queryFn: () => apiFetch<{ banks: Bank[] }>("/api/monnify/banks").then((r) => r.banks),
  });

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
    <div className="mx-auto max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Payout bank account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            We verify this account with Monnify before saving it, so payouts
            never go to the wrong place.
          </p>

          <div className="space-y-1.5">
            <Label>Bank</Label>
            <Select
              value={bankCode}
              onValueChange={(value) => setBankCode(value ?? "")}
              disabled={loadingBanks}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingBanks ? "Loading banks…" : "Select your bank"} />
              </SelectTrigger>
              <SelectContent>
                {banks?.map((bank) => (
                  <SelectItem key={bank.code} value={bank.code}>
                    {bank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <div className="rounded-lg border bg-accent/50 p-3 text-sm">
              Verified: <span className="font-medium">{verifiedName}</span>
            </div>
          )}

          <Button
            className="w-full"
            disabled={!bankCode || accountNumber.length !== 10 || verify.isPending}
            onClick={() => verify.mutate()}
          >
            {verify.isPending ? "Verifying…" : "Verify and save"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

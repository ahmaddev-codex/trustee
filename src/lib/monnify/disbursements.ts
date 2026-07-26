import { monnifyFetch } from "./client";

export interface InitiateSingleTransferInput {
  amount: number;
  reference: string;
  narration: string;
  destinationBankCode: string;
  destinationAccountNumber: string;
  destinationAccountName: string;
}

export type TransferStatus =
  | "PENDING_AUTHORIZATION"
  | "PENDING"
  | "AWAITING_PROCESSING"
  | "IN_PROGRESS"
  | "SUCCESS"
  | "COMPLETED"
  | "REVERSED"
  | "FAILED"
  | "EXPIRED";

export interface TransferResult {
  reference: string;
  status: TransferStatus;
  amount: number;
}

// Requires disbursements enabled on the Monnify account and
// MONNIFY_WALLET_ACCOUNT_NUMBER set to the merchant's wallet account.
export async function initiateSingleTransfer(
  input: InitiateSingleTransferInput,
): Promise<TransferResult> {
  const sourceAccountNumber = process.env.MONNIFY_WALLET_ACCOUNT_NUMBER;
  if (!sourceAccountNumber) {
    throw new Error("MONNIFY_WALLET_ACCOUNT_NUMBER is not set");
  }

  return monnifyFetch<TransferResult>("/api/v2/disbursements/single", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      currency: "NGN",
      sourceAccountNumber,
    }),
  });
}

// NOTE: /validate-otp, /resend-otp, /summary are based on Monnify's docs but
// unconfirmed against a live call - disbursements weren't enabled on this
// sandbox key yet. Confirm once disbursements are enabled (see docs/action-points.md).
export async function authorizeSingleTransfer(
  reference: string,
  authorizationCode: string,
): Promise<TransferResult> {
  return monnifyFetch<TransferResult>(
    "/api/v2/disbursements/single/validate-otp",
    {
      method: "POST",
      body: JSON.stringify({ reference, authorizationCode }),
    },
  );
}

export async function resendSingleTransferOtp(reference: string): Promise<void> {
  await monnifyFetch("/api/v2/disbursements/single/resend-otp", {
    method: "POST",
    body: JSON.stringify({ reference }),
  });
}

export async function getSingleTransferStatus(
  reference: string,
): Promise<TransferResult> {
  return monnifyFetch<TransferResult>(
    `/api/v2/disbursements/single/summary?reference=${encodeURIComponent(reference)}`,
  );
}

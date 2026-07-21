import { monnifyFetch } from "./client";

export interface InitializeTransactionInput {
  amount: number;
  customerName: string;
  customerEmail: string;
  paymentReference: string;
  paymentDescription: string;
  redirectUrl: string;
}

export interface InitializeTransactionResult {
  transactionReference: string;
  paymentReference: string;
  checkoutUrl: string;
}

export async function initializeTransaction(
  input: InitializeTransactionInput,
): Promise<InitializeTransactionResult> {
  const contractCode = process.env.MONNIFY_CONTRACT_CODE;
  if (!contractCode) {
    throw new Error("MONNIFY_CONTRACT_CODE is not set");
  }

  return monnifyFetch<InitializeTransactionResult>(
    "/api/v1/merchant/transactions/init-transaction",
    {
      method: "POST",
      body: JSON.stringify({
        ...input,
        currencyCode: "NGN",
        contractCode,
      }),
    },
  );
}

export type PaymentStatus =
  | "PAID"
  | "PENDING"
  | "OVERPAID"
  | "PARTIALLY_PAID"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export interface VerifyTransactionResult {
  transactionReference: string;
  paymentReference: string;
  paymentStatus: PaymentStatus;
  amountPaid: string;
  paidOn: string | null;
}

export async function verifyTransactionByPaymentReference(
  paymentReference: string,
): Promise<VerifyTransactionResult> {
  return monnifyFetch<VerifyTransactionResult>(
    `/api/v2/merchant/transactions/query?paymentReference=${encodeURIComponent(paymentReference)}`,
  );
}

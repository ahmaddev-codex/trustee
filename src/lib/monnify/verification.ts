import { monnifyFetch } from "./client";

export interface Bank {
  name: string;
  code: string;
  nipBankCode: string | null;
}

export async function getBanks(): Promise<Bank[]> {
  return monnifyFetch<Bank[]>("/api/v1/banks");
}

export interface NameEnquiryResult {
  accountNumber: string;
  accountName: string;
  bankCode: string;
}

export async function nameEnquiry(
  accountNumber: string,
  bankCode: string,
): Promise<NameEnquiryResult> {
  return monnifyFetch<NameEnquiryResult>(
    `/api/v1/disbursements/account/validate?accountNumber=${encodeURIComponent(accountNumber)}&bankCode=${encodeURIComponent(bankCode)}`,
  );
}

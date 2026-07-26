import { createHash } from "crypto";

// Monnify signs webhook bodies with SHA-512(secretKey + body) in the
// `monnify-signature` header - sandbox never sends it, so skip outside production.
export function isValidWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const secretKey = process.env.MONNIFY_SECRET_KEY;
  if (!secretKey || !signatureHeader) return false;

  const expected = createHash("sha512").update(secretKey + rawBody).digest("hex");
  return expected === signatureHeader;
}

export interface MonnifyWebhookPayload {
  eventType: string;
  eventData: Record<string, unknown> & {
    paymentReference?: string;
    transactionReference?: string;
    paymentStatus?: string;
    reference?: string;
    status?: string;
  };
}

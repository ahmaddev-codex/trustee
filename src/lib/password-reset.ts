import { createHash, randomBytes } from "crypto";

const RESET_TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ?? "60");

// The raw token goes out in the email link; only its hash is stored, so a
// database read can't be replayed as a working token (like bcrypt, but cheaper since this is already random).
export function generateResetToken(): { raw: string; hash: string; expiresAt: Date } {
  const raw = randomBytes(32).toString("hex");
  return {
    raw,
    hash: hashResetToken(raw),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
  };
}

export function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

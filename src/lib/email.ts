const BASE_URL = "https://api.resend.com";
const FROM = process.env.EMAIL_FROM ?? "Trustee <onboarding@resend.dev>";

export class EmailError extends Error {
  raw: unknown;
  constructor(message: string, raw: unknown) {
    super(message);
    this.raw = raw;
  }
}

// Hand-rolled Resend API call (same pattern as groq.ts/monnify/client.ts) —
// no SDK needed for a single endpoint (see docs/action-points.md).
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new EmailError("Email is not configured — set RESEND_API_KEY", undefined);
  }

  const res = await fetch(`${BASE_URL}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new EmailError(body?.message ?? `Email send failed (${res.status})`, body);
  }
}

const BASE_URL = process.env.MONNIFY_BASE_URL ?? "https://sandbox.monnify.com";

let cachedToken: { token: string; expiresAt: number } | undefined;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const apiKey = process.env.MONNIFY_API_KEY;
  const secretKey = process.env.MONNIFY_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new Error("Monnify is not configured - set MONNIFY_API_KEY and MONNIFY_SECRET_KEY");
  }

  const basicAuth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");

  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { Authorization: `Basic ${basicAuth}` },
  });

  const body = await res.json();
  if (!res.ok || !body.requestSuccessful) {
    throw new MonnifyError(body.responseMessage ?? "Failed to authenticate with Monnify", body);
  }

  const { accessToken, expiresIn } = body.responseBody as {
    accessToken: string;
    expiresIn: number;
  };

  // Refresh a little early to avoid using a token that expires mid-request.
  cachedToken = { token: accessToken, expiresAt: Date.now() + (expiresIn - 60) * 1000 };
  return accessToken;
}

export class MonnifyError extends Error {
  responseCode?: string;
  raw: unknown;
  constructor(message: string, raw: unknown) {
    super(message);
    this.raw = raw;
    if (raw && typeof raw === "object" && "responseCode" in raw) {
      this.responseCode = String((raw as { responseCode: unknown }).responseCode);
    }
  }
}

export async function monnifyFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.requestSuccessful) {
    throw new MonnifyError(body?.responseMessage ?? `Monnify request failed (${res.status})`, body);
  }

  return body.responseBody as T;
}

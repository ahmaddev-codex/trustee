const BASE_URL = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
const MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

export class GroqError extends Error {
  raw: unknown;
  constructor(message: string, raw: unknown) {
    super(message);
    this.raw = raw;
  }
}

async function groqJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqError("Groq is not configured - set GROQ_API_KEY", undefined);
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new GroqError(body?.error?.message ?? `Groq request failed (${res.status})`, body);
  }

  const content = body?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new GroqError("Groq returned an unexpected response shape", body);
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new GroqError("Groq returned invalid JSON", content);
  }
}

export type DisputeSuggestion = {
  suggestion: "RELEASE" | "REFUND" | "UNCLEAR";
  reasoning: string;
};

export async function analyzeDispute(input: {
  listingTitle: string;
  amountNaira: number;
  raisedByRole: "buyer" | "seller";
  reason: string;
  fundedAt: Date | null;
  shippedAt: Date | null;
}): Promise<DisputeSuggestion> {
  const system =
    "You are a dispute-resolution assistant for Trustee, a P2P classifieds escrow app. " +
    "Given an order/dispute summary, suggest whether the admin should RELEASE funds to the seller, " +
    "REFUND the buyer, or mark it UNCLEAR if there isn't enough information to tell. " +
    'Respond with strict JSON only: {"suggestion": "RELEASE" | "REFUND" | "UNCLEAR", "reasoning": string}. ' +
    "Keep reasoning to 2-3 sentences. This is a suggestion only - a human admin makes the final call.";

  const user = [
    `Listing: ${input.listingTitle}`,
    `Amount: ₦${input.amountNaira.toLocaleString("en-NG")}`,
    `Dispute raised by: ${input.raisedByRole}`,
    `Funded: ${input.fundedAt ? input.fundedAt.toISOString() : "not yet"}`,
    `Shipped: ${input.shippedAt ? input.shippedAt.toISOString() : "not marked shipped"}`,
    `Reason given: ${input.reason}`,
  ].join("\n");

  const result = await groqJson<DisputeSuggestion>(system, user);
  if (!["RELEASE", "REFUND", "UNCLEAR"].includes(result.suggestion)) {
    return {
      suggestion: "UNCLEAR",
      reasoning: result.reasoning ?? "Could not parse a clear suggestion.",
    };
  }
  return result;
}

export type ListingScreenResult = {
  flagged: boolean;
  reason: string | null;
};

export async function screenListing(input: {
  title: string;
  description: string;
  priceNaira: number;
  category: string;
}): Promise<ListingScreenResult> {
  const system =
    "You screen new listings on Trustee, a P2P classifieds escrow marketplace, for scam signals: " +
    "prices implausibly below market for the category, bait-and-switch or off-platform-payment wording, " +
    "counterfeit/prohibited goods, or vague descriptions typical of scam listings. " +
    'Respond with strict JSON only: {"flagged": boolean, "reason": string | null}. ' +
    "Only flag listings with a real signal - most legitimate listings should NOT be flagged. " +
    "reason must be null when flagged is false, and a short (<=200 char) explanation when true.";

  const user = [
    `Category: ${input.category}`,
    `Price: ₦${input.priceNaira.toLocaleString("en-NG")}`,
    `Title: ${input.title}`,
    `Description: ${input.description}`,
  ].join("\n");

  const result = await groqJson<ListingScreenResult>(system, user);
  return {
    flagged: Boolean(result.flagged),
    reason: result.flagged ? (result.reason ?? null) : null,
  };
}

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isValidWebhookSignature } from "@/lib/monnify";
import { fundOrdersByPaymentReference } from "@/lib/fund-orders";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("monnify-signature");

  if (!isValidWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error("Failed to parse Monnify webhook payload:", error);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventType: string = payload.eventType ?? "UNKNOWN";
  const paymentReference: string | undefined =
    payload.eventData?.paymentReference ?? payload.eventData?.paymentReferenceCode;

  try {
    await prisma.webhookEvent.create({
      data: {
        eventType,
        paymentReference: paymentReference ?? "unknown",
        rawPayload: payload,
      },
    });

    // Always acknowledge quickly - we re-verify authoritatively via the
    // Verify Transaction API below rather than trusting the webhook body.
    if (!paymentReference) {
      return NextResponse.json({ received: true });
    }

    try {
      await fundOrdersByPaymentReference(paymentReference);
    } catch (error) {
      console.error("Failed to verify Monnify transaction from webhook:", error);
      // Webhook will retry, or the order/cart page's manual verify fallback will catch it.
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Failed to process Monnify webhook:", error);
    // Monnify retries on non-2xx - acknowledge anyway since we've logged the
    // failure and the order page's manual verify fallback can still recover it.
    return NextResponse.json({ received: true });
  }
}

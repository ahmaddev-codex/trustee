import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isValidWebhookSignature, verifyTransactionByPaymentReference } from "@/lib/monnify";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("monnify-signature");

  if (!isValidWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventType: string = payload.eventType ?? "UNKNOWN";
  const paymentReference: string | undefined =
    payload.eventData?.paymentReference ?? payload.eventData?.paymentReferenceCode;

  await prisma.webhookEvent.create({
    data: {
      eventType,
      paymentReference: paymentReference ?? "unknown",
      rawPayload: payload,
    },
  });

  // Always respond quickly and acknowledge — we re-verify authoritatively via
  // the Verify Transaction API below rather than trusting the webhook body,
  // per Monnify's own guidance.
  if (!paymentReference) {
    return NextResponse.json({ received: true });
  }

  const order = await prisma.order.findUnique({
    where: { monnifyPaymentReference: paymentReference },
  });

  if (!order || order.status !== "AWAITING_PAYMENT") {
    return NextResponse.json({ received: true });
  }

  try {
    const verified = await verifyTransactionByPaymentReference(paymentReference);
    if (verified.paymentStatus === "PAID") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FUNDED", fundedAt: new Date() },
      });
    }
  } catch {
    // Webhook will retry, or the order page's manual verify fallback will catch it.
  }

  return NextResponse.json({ received: true });
}

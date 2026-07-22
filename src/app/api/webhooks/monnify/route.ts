import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isValidWebhookSignature, verifyTransactionByPaymentReference } from "@/lib/monnify";
import { notify } from "@/lib/notifications";

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

    // Always respond quickly and acknowledge — we re-verify authoritatively via
    // the Verify Transaction API below rather than trusting the webhook body,
    // per Monnify's own guidance.
    if (!paymentReference) {
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.findUnique({
      where: { monnifyPaymentReference: paymentReference },
      include: { listing: { select: { title: true } } },
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
        await notify({
          userId: order.sellerId,
          type: "ORDER_FUNDED",
          title: "Your item sold",
          body: `Payment received for "${order.listing.title}" — mark it shipped when it's on its way.`,
          link: `/orders/${order.id}`,
        });
      }
    } catch (error) {
      console.error("Failed to verify Monnify transaction from webhook:", error);
      // Webhook will retry, or the order page's manual verify fallback will catch it.
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Failed to process Monnify webhook:", error);
    // Monnify retries on non-2xx — acknowledge anyway since we've logged the
    // failure and the order page's manual verify fallback can still recover it.
    return NextResponse.json({ received: true });
  }
}

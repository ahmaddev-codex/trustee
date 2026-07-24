import { prisma } from "@/lib/prisma";
import { verifyTransactionByPaymentReference } from "@/lib/monnify";
import { notify } from "@/lib/notifications";

// Flips every AWAITING_PAYMENT order sharing a payment reference to FUNDED —
// a cart checkout puts several orders (one per seller) under one reference,
// so a single payment must fund all of them together. Used by both the
// webhook and the cart checkout-success page's verify-transaction fallback.
export async function fundOrdersByPaymentReference(paymentReference: string) {
  const pending = await prisma.order.findMany({
    where: { monnifyPaymentReference: paymentReference, status: "AWAITING_PAYMENT" },
    include: { listing: { select: { title: true } } },
  });

  if (pending.length === 0) return;

  const verified = await verifyTransactionByPaymentReference(paymentReference);
  if (verified.paymentStatus !== "PAID") return;

  const fundedAt = new Date();
  await prisma.order.updateMany({
    where: { id: { in: pending.map((o) => o.id) } },
    data: { status: "FUNDED", fundedAt },
  });

  for (const order of pending) {
    await notify({
      userId: order.sellerId,
      type: "ORDER_FUNDED",
      title: "Your item sold",
      body: `Payment received for "${order.listing.title}" — mark it shipped when it's on its way.`,
      link: `/orders/${order.id}`,
    });
  }
}

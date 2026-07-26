import { prisma } from "@/lib/prisma";
import { verifyTransactionByPaymentReference } from "@/lib/monnify";
import { orderSummaryTitle } from "@/lib/order-summary";
import { notify } from "@/lib/notifications";

// Flips every AWAITING_PAYMENT order sharing a payment reference to FUNDED -
// a cart checkout groups orders per seller, so one payment funds them all.
export async function fundOrdersByPaymentReference(paymentReference: string) {
  const pending = await prisma.order.findMany({
    where: { monnifyPaymentReference: paymentReference, status: "AWAITING_PAYMENT" },
    include: { items: { include: { listing: { select: { title: true } } } } },
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
      body: `Payment received for **${orderSummaryTitle(order.items)}**. Mark it shipped when it's on its way.`,
      link: `/orders/${order.id}`,
    });
  }
}

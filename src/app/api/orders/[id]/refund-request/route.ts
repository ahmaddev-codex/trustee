import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { koboToNairaAmount } from "@/lib/money";
import { refundEligibleAt } from "@/lib/escrow";
import { initiateSingleTransfer, MonnifyError } from "@/lib/monnify";
import { serializeOrder } from "@/lib/serialize";
import { orderSummaryTitle } from "@/lib/order-summary";
import { notify, notifyAdmins } from "@/lib/notifications";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/orders/[id]/refund-request">,
) {
  const { id } = await ctx.params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { buyer: true, items: { include: { listing: { select: { title: true } } } } },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.buyerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (order.status !== "FUNDED" || !order.fundedAt) {
      return NextResponse.json({ error: "This order isn't eligible for a refund" }, { status: 409 });
    }
    if (new Date() < refundEligibleAt(order.fundedAt)) {
      return NextResponse.json(
        { error: "Give the seller a bit more time to ship before requesting a refund" },
        { status: 409 },
      );
    }

    const { buyer } = order;
    if (!buyer.bankAccountNumber || !buyer.bankCode || !buyer.bankAccountName) {
      return NextResponse.json(
        { error: "Add a verified payout account first so we know where to send the refund" },
        { status: 409 },
      );
    }

    const reference = `refund-${order.id}`;
    const title = orderSummaryTitle(order.items);

    try {
      const transfer = await initiateSingleTransfer({
        amount: koboToNairaAmount(order.amountKobo),
        reference,
        narration: `Trustee refund - ${title}`,
        destinationBankCode: buyer.bankCode,
        destinationAccountNumber: buyer.bankAccountNumber,
        destinationAccountName: buyer.bankAccountName,
      });

      const isComplete = transfer.status === "SUCCESS" || transfer.status === "COMPLETED";

      const [updated] = await prisma.$transaction([
        prisma.order.update({
          where: { id },
          data: {
            monnifyDisbursementRef: reference,
            ...(isComplete ? { status: "REFUNDED", refundedAt: new Date() } : {}),
          },
        }),
        // The sale fell through - put every item's listing back on the market.
        ...(isComplete
          ? [
              prisma.listing.updateMany({
                where: { id: { in: order.items.map((item) => item.listingId) } },
                data: { status: "ACTIVE" },
              }),
            ]
          : []),
      ]);

      if (isComplete) {
        await notify({
          userId: order.sellerId,
          type: "REFUND_ISSUED",
          title: "Buyer refunded",
          body: `The buyer was refunded for **${title}**. You didn't ship in time.`,
          link: `/orders/${order.id}`,
        });
      } else {
        await notify({
          userId: order.sellerId,
          type: "REFUND_PENDING",
          title: "Buyer requested a refund",
          body: `A refund for **${title}** is pending authorization.`,
          link: `/orders/${order.id}`,
        });
        await notifyAdmins({
          type: "REFUND_NEEDS_AUTH",
          title: "Refund needs OTP authorization",
          body: `Refund for **${title}** is pending authorization.`,
          link: "/dashboard?tab=payouts",
        });
      }

      return NextResponse.json({ order: serializeOrder(updated), pendingAuthorization: !isComplete });
    } catch (error) {
      console.error("Failed to initiate refund:", error);
      const message =
        error instanceof MonnifyError
          ? error.message
          : "Could not start the refund. Please try again.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (error) {
    console.error("Failed to request refund:", error);
    return NextResponse.json(
      { error: "Failed to request refund. Please try again." },
      { status: 500 },
    );
  }
}

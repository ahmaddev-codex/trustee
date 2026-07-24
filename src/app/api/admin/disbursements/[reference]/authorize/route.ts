import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorizeSingleTransfer, MonnifyError } from "@/lib/monnify";
import { serializeOrder } from "@/lib/serialize";
import { notify } from "@/lib/notifications";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/admin/disbursements/[reference]/authorize">,
) {
  const { reference } = await ctx.params;

  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const otp = typeof json?.otp === "string" ? json.otp.trim() : "";
  if (!otp) {
    return NextResponse.json({ error: "Enter the OTP" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findFirst({
      where: { monnifyDisbursementRef: reference },
      include: { listing: { select: { title: true } } },
    });
    if (!order) {
      return NextResponse.json({ error: "No order matches this disbursement" }, { status: 404 });
    }

    try {
      const transfer = await authorizeSingleTransfer(reference, otp);
      const isComplete = transfer.status === "SUCCESS" || transfer.status === "COMPLETED";

      if (!isComplete) {
        return NextResponse.json(
          { error: `Transfer status is still ${transfer.status}` },
          { status: 409 },
        );
      }

      // Reference prefix tells us which side of the escrow this transfer settles
      // ("payout-"/"dispute-release-" pay the seller, "refund-"/"dispute-refund-"
      // return the buyer) — more reliable than inferring intent from the
      // order's current status, which is the same for both dispute outcomes.
      const targetStatus = reference.includes("refund") ? "REFUNDED" : "RELEASED";

      const [updated] = await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: targetStatus,
            ...(targetStatus === "RELEASED"
              ? { releasedAt: new Date() }
              : { refundedAt: new Date() }),
          },
        }),
        prisma.dispute.updateMany({
          where: { orderId: order.id, status: "OPEN" },
          data: {
            status: targetStatus === "RELEASED" ? "RESOLVED_RELEASE" : "RESOLVED_REFUND",
            resolvedAt: new Date(),
          },
        }),
        // If this transfer refunds the buyer, the sale fell through — put the
        // listing back on the market.
        ...(targetStatus === "REFUNDED"
          ? [prisma.listing.update({ where: { id: order.listingId }, data: { status: "ACTIVE" as const } })]
          : []),
      ]);

      // This transfer was left pending OTP authorization earlier — whoever was
      // told to expect it (the beneficiary, plus both sides if a dispute
      // resolution was waiting on it) needs to hear that it actually landed.
      const isDispute = reference.startsWith("dispute-");
      if (targetStatus === "RELEASED") {
        await notify({
          userId: order.sellerId,
          type: "PAYOUT_RELEASED",
          title: "Payment released to you",
          body: `Your payout for "${order.listing.title}" has been sent.`,
          link: `/orders/${order.id}`,
        });
        if (isDispute) {
          await notify({
            userId: order.buyerId,
            type: "DISPUTE_RESOLVED",
            title: "Dispute resolved",
            body: `The dispute for "${order.listing.title}" was resolved — funds were released to the seller.`,
            link: `/orders/${order.id}`,
          });
        }
      } else {
        await notify({
          userId: order.buyerId,
          type: "REFUND_ISSUED",
          title: "Refund sent",
          body: `Your refund for "${order.listing.title}" has been sent.`,
          link: `/orders/${order.id}`,
        });
        await notify({
          userId: order.sellerId,
          type: isDispute ? "DISPUTE_RESOLVED" : "REFUND_ISSUED",
          title: isDispute ? "Dispute resolved" : "Buyer refunded",
          body: isDispute
            ? `The dispute for "${order.listing.title}" was resolved — funds were refunded to the buyer.`
            : `The buyer was refunded for "${order.listing.title}".`,
          link: `/orders/${order.id}`,
        });
      }

      return NextResponse.json({ order: serializeOrder(updated) });
    } catch (error) {
      console.error("Failed to authorize transfer:", error);
      const message = error instanceof MonnifyError ? error.message : "Could not authorize transfer";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (error) {
    console.error("Failed to authorize disbursement:", error);
    return NextResponse.json(
      { error: "Failed to authorize disbursement. Please try again." },
      { status: 500 },
    );
  }
}

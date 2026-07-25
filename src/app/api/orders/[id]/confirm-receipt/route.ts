import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MonnifyError } from "@/lib/monnify";
import { releaseFundsToSeller } from "@/lib/release";
import { serializeOrder } from "@/lib/serialize";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/orders/[id]/confirm-receipt">,
) {
  const { id } = await ctx.params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { seller: true, items: { include: { listing: { select: { title: true, imageUrls: true } } } } },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.buyerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (order.status !== "SHIPPED") {
      return NextResponse.json({ error: "This order isn't ready to release" }, { status: 409 });
    }

    if (!order.seller.bankAccountNumber || !order.seller.bankCode || !order.seller.bankAccountName) {
      return NextResponse.json(
        { error: "The seller hasn't added a verified payout account yet" },
        { status: 409 },
      );
    }

    try {
      const result = await releaseFundsToSeller(order);
      return NextResponse.json({
        order: serializeOrder(result.order),
        transferStatus: result.transferStatus,
        pendingAuthorization: result.pendingAuthorization,
      });
    } catch (error) {
      console.error("Failed to initiate payout:", error);
      const message =
        error instanceof MonnifyError
          ? error.message
          : "Could not start the payout. Please try again.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (error) {
    console.error("Failed to confirm receipt:", error);
    return NextResponse.json(
      { error: "Failed to confirm receipt. Please try again." },
      { status: 500 },
    );
  }
}

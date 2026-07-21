import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { koboToNairaAmount } from "@/lib/money";
import { initiateSingleTransfer, MonnifyError } from "@/lib/monnify";
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

  const order = await prisma.order.findUnique({
    where: { id },
    include: { seller: true, listing: { select: { title: true } } },
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

  const { seller } = order;
  if (!seller.bankAccountNumber || !seller.bankCode || !seller.bankAccountName) {
    return NextResponse.json(
      { error: "The seller hasn't added a verified payout account yet" },
      { status: 409 },
    );
  }

  const payoutKobo = order.amountKobo - order.platformFeeKobo;
  const reference = `payout-${order.id}`;

  try {
    const transfer = await initiateSingleTransfer({
      amount: koboToNairaAmount(payoutKobo),
      reference,
      narration: `Trustee payout — ${order.listing.title}`,
      destinationBankCode: seller.bankCode,
      destinationAccountNumber: seller.bankAccountNumber,
      destinationAccountName: seller.bankAccountName,
    });

    const isComplete = transfer.status === "SUCCESS" || transfer.status === "COMPLETED";

    const updated = await prisma.order.update({
      where: { id },
      data: {
        monnifyDisbursementRef: reference,
        ...(isComplete ? { status: "RELEASED", releasedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({
      order: serializeOrder(updated),
      transferStatus: transfer.status,
      pendingAuthorization: !isComplete,
    });
  } catch (error) {
    const message =
      error instanceof MonnifyError
        ? error.message
        : "Could not start the payout. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { koboToNairaAmount } from "@/lib/money";
import { initiateSingleTransfer, MonnifyError } from "@/lib/monnify";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/admin/disputes/[id]/resolve">,
) {
  const { id } = await ctx.params;

  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const resolution = json?.resolution;
  const note = typeof json?.note === "string" ? json.note : undefined;
  if (resolution !== "RELEASE" && resolution !== "REFUND") {
    return NextResponse.json({ error: "resolution must be RELEASE or REFUND" }, { status: 400 });
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      order: { include: { buyer: true, seller: true, listing: { select: { title: true } } } },
    },
  });
  if (!dispute || dispute.status !== "OPEN") {
    return NextResponse.json({ error: "Dispute not found or already resolved" }, { status: 404 });
  }

  const { order } = dispute;
  const beneficiary = resolution === "RELEASE" ? order.seller : order.buyer;
  if (!beneficiary.bankAccountNumber || !beneficiary.bankCode || !beneficiary.bankAccountName) {
    return NextResponse.json(
      { error: `The ${resolution === "RELEASE" ? "seller" : "buyer"} hasn't added a verified payout account` },
      { status: 409 },
    );
  }

  const amountKobo = resolution === "RELEASE" ? order.amountKobo - order.platformFeeKobo : order.amountKobo;
  const reference = `dispute-${resolution.toLowerCase()}-${order.id}`;

  try {
    const transfer = await initiateSingleTransfer({
      amount: koboToNairaAmount(amountKobo),
      reference,
      narration: `Trustee dispute resolution — ${order.listing.title}`,
      destinationBankCode: beneficiary.bankCode,
      destinationAccountNumber: beneficiary.bankAccountNumber,
      destinationAccountName: beneficiary.bankAccountName,
    });

    const isComplete = transfer.status === "SUCCESS" || transfer.status === "COMPLETED";
    const targetStatus = resolution === "RELEASE" ? "RELEASED" : "REFUNDED";

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          monnifyDisbursementRef: reference,
          ...(isComplete
            ? {
                status: targetStatus,
                ...(targetStatus === "RELEASED"
                  ? { releasedAt: new Date() }
                  : { refundedAt: new Date() }),
              }
            : {}),
        },
      }),
      prisma.dispute.update({
        where: { id },
        data: {
          resolutionNote: note,
          ...(isComplete
            ? {
                status: targetStatus === "RELEASED" ? "RESOLVED_RELEASE" : "RESOLVED_REFUND",
                resolvedAt: new Date(),
              }
            : {}),
        },
      }),
    ]);

    return NextResponse.json({ pendingAuthorization: !isComplete });
  } catch (error) {
    const message = error instanceof MonnifyError ? error.message : "Could not start the transfer";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

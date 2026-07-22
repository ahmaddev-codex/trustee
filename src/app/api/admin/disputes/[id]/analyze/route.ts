import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { koboToNairaAmount } from "@/lib/money";
import { analyzeDispute, GroqError } from "@/lib/groq";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/admin/disputes/[id]/analyze">,
) {
  const { id } = await ctx.params;

  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      order: { include: { listing: { select: { title: true } } } },
      raisedBy: { select: { id: true } },
    },
  });
  if (!dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  try {
    const suggestion = await analyzeDispute({
      listingTitle: dispute.order.listing.title,
      amountNaira: koboToNairaAmount(dispute.order.amountKobo),
      raisedByRole: dispute.raisedById === dispute.order.buyerId ? "buyer" : "seller",
      reason: dispute.reason,
      fundedAt: dispute.order.fundedAt,
      shippedAt: dispute.order.shippedAt,
    });
    return NextResponse.json(suggestion);
  } catch (error) {
    const message = error instanceof GroqError ? error.message : "Could not get an AI suggestion";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

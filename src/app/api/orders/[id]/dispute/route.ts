import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notifications";

export async function POST(request: Request, ctx: RouteContext<"/api/orders/[id]/dispute">) {
  const { id } = await ctx.params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const reason = typeof json?.reason === "string" ? json.reason.trim() : "";
  if (reason.length < 5) {
    return NextResponse.json({ error: "Tell us a bit more about the issue" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { listing: { select: { title: true } } },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.buyerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (order.status !== "FUNDED" && order.status !== "SHIPPED") {
      return NextResponse.json({ error: "This order can't be disputed" }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.dispute.create({
        data: { orderId: id, raisedById: session.user.id, reason },
      }),
      prisma.order.update({ where: { id }, data: { status: "DISPUTED" } }),
    ]);

    await notifyAdmins({
      type: "DISPUTE_RAISED",
      title: "New dispute raised",
      body: `A dispute was raised for "${order.listing.title}".`,
      link: "/dashboard?tab=disputes",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to raise dispute:", error);
    return NextResponse.json(
      { error: "Failed to raise dispute. Please try again." },
      { status: 500 },
    );
  }
}

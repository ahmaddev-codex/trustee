import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { autoReleaseDeadline } from "@/lib/escrow";
import { serializeOrder } from "@/lib/serialize";
import { notify } from "@/lib/notifications";

export async function POST(_request: Request, ctx: RouteContext<"/api/orders/[id]/ship">) {
  const { id } = await ctx.params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { listing: { select: { title: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.sellerId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  if (order.status !== "FUNDED") {
    return NextResponse.json({ error: "This order isn't ready to ship" }, { status: 409 });
  }

  const shippedAt = new Date();

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: "SHIPPED",
      shippedAt,
      autoReleaseAt: autoReleaseDeadline(shippedAt),
    },
  });

  await notify({
    userId: order.buyerId,
    type: "ORDER_SHIPPED",
    title: "Item shipped",
    body: `"${order.listing.title}" is on its way — confirm receipt once it arrives.`,
    link: `/orders/${order.id}`,
  });

  return NextResponse.json({ order: serializeOrder(updated) });
}

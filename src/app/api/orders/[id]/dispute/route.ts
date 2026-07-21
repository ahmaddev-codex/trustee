import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const order = await prisma.order.findUnique({ where: { id } });
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

  return NextResponse.json({ success: true });
}

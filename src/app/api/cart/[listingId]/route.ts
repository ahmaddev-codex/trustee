import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/cart/[listingId]">,
) {
  const { listingId } = await ctx.params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id, listingId },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to remove cart item:", error);
    return NextResponse.json(
      { error: "Failed to remove item. Please try again." },
      { status: 500 },
    );
  }
}

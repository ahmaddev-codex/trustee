import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, ctx: RouteContext<"/api/listings/[id]/relist">) {
  const { id } = await ctx.params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (listing.status !== "REMOVED") {
      return NextResponse.json({ error: "Only delisted listings can be relisted" }, { status: 409 });
    }

    await prisma.listing.update({ where: { id }, data: { status: "ACTIVE" } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to relist listing:", error);
    return NextResponse.json(
      { error: "Failed to relist listing. Please try again." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/admin/listings/[id]/moderate">,
) {
  const { id } = await ctx.params;

  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const action = json?.action;
  if (action !== "DISMISS" && action !== "REMOVE") {
    return NextResponse.json({ error: "action must be DISMISS or REMOVE" }, { status: 400 });
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  await prisma.listing.update({
    where: { id },
    data:
      action === "DISMISS"
        ? { aiFlagged: false, aiFlagReason: null }
        : { status: "REMOVED", aiFlagged: false, aiFlagReason: null },
  });

  return NextResponse.json({ ok: true });
}

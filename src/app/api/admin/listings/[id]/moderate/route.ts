import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";

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

  try {
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

    if (action === "REMOVE") {
      await notify({
        userId: listing.sellerId,
        type: "LISTING_REMOVED",
        title: "Your listing was removed",
        body: `"${listing.title}" was taken down by a Trustee admin after review.`,
        link: "/dashboard",
      });
    } else {
      await notify({
        userId: listing.sellerId,
        type: "LISTING_CLEARED",
        title: "Your listing passed review",
        body: `"${listing.title}" was reviewed and is live as normal.`,
        link: `/listings/${listing.id}`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to moderate listing:", error);
    return NextResponse.json(
      { error: "Failed to moderate listing. Please try again." },
      { status: 500 },
    );
  }
}

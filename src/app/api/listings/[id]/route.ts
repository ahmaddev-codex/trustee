import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createListingSchema } from "@/lib/validations/listing";
import { nairaToKobo } from "@/lib/money";
import { screenListing } from "@/lib/groq";
import { notifyAdmins } from "@/lib/notifications";

export async function PATCH(request: Request, ctx: RouteContext<"/api/listings/[id]">) {
  const { id } = await ctx.params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = createListingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { title, description, priceNaira, category, imageUrls } = parsed.data;

  try {
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (listing.status === "SOLD") {
      return NextResponse.json(
        { error: "This listing has a sale in progress and can't be edited" },
        { status: 409 },
      );
    }

    let updated = await prisma.listing.update({
      where: { id },
      data: {
        title,
        description,
        priceKobo: nairaToKobo(priceNaira),
        category,
        imageUrls,
        // Editing changes the content Groq screened at creation time - clear
        // any prior flag and re-screen below rather than leave a stale one.
        aiFlagged: false,
        aiFlagReason: null,
      },
    });

    try {
      const screen = await screenListing({ title, description, priceNaira, category });
      if (screen.flagged) {
        updated = await prisma.listing.update({
          where: { id },
          data: { aiFlagged: true, aiFlagReason: screen.reason },
        });
        await notifyAdmins({
          type: "LISTING_FLAGGED",
          title: "Listing flagged for review",
          body: `**${title}** was flagged: ${screen.reason ?? "possible scam signal"}`,
          link: "/dashboard?tab=flagged",
        });
      }
    } catch (error) {
      console.error("Listing scam-screen failed, leaving listing unflagged", error);
    }

    return NextResponse.json({
      listing: { ...updated, priceKobo: updated.priceKobo.toString() },
    });
  } catch (error) {
    console.error("Failed to update listing:", error);
    return NextResponse.json(
      { error: "Failed to update listing. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/listings/[id]">) {
  const { id } = await ctx.params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { _count: { select: { orderItems: true } } },
    });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    if (listing.status === "SOLD") {
      return NextResponse.json(
        { error: "This listing has a sale in progress and can't be deleted" },
        { status: 409 },
      );
    }
    // OrderItem rows are kept forever for order/audit history - deleting a
    // listing that was ever part of an order (any status, including
    // cancelled/refunded) would corrupt that record. Delist it instead.
    if (listing._count.orderItems > 0) {
      return NextResponse.json(
        { error: "This listing has order history and can't be deleted - delist it instead" },
        { status: 409 },
      );
    }

    // Cart rows are ephemeral and safe to drop along with the listing.
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { listingId: id } }),
      prisma.listing.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete listing:", error);
    return NextResponse.json(
      { error: "Failed to delete listing. Please try again." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createListingSchema } from "@/lib/validations/listing";
import { nairaToKobo } from "@/lib/money";
import { screenListing } from "@/lib/groq";
import { notifyAdmins } from "@/lib/notifications";

export async function POST(request: Request) {
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
    let listing = await prisma.listing.create({
      data: {
        sellerId: session.user.id,
        title,
        description,
        priceKobo: nairaToKobo(priceNaira),
        category,
        imageUrls,
      },
    });

    try {
      const screen = await screenListing({ title, description, priceNaira, category });
      if (screen.flagged) {
        listing = await prisma.listing.update({
          where: { id: listing.id },
          data: { aiFlagged: true, aiFlagReason: screen.reason },
        });
        await notifyAdmins({
          type: "LISTING_FLAGGED",
          title: "Listing flagged for review",
          body: `"${title}" was flagged: ${screen.reason ?? "possible scam signal"}`,
          link: "/admin",
        });
      }
    } catch (error) {
      console.error("Listing scam-screen failed, leaving listing unflagged", error);
    }

    return NextResponse.json(
      { listing: { ...listing, priceKobo: listing.priceKobo.toString() } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create listing:", error);
    return NextResponse.json(
      { error: "Failed to create listing. Please try again." },
      { status: 500 },
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const listings = await prisma.listing.findMany({
      where: { sellerId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      listings: listings.map((l) => ({ ...l, priceKobo: l.priceKobo.toString() })),
    });
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    return NextResponse.json(
      { error: "Failed to fetch listings. Please try again." },
      { status: 500 },
    );
  }
}

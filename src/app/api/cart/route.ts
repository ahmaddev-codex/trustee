import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            priceKobo: true,
            imageUrls: true,
            status: true,
            seller: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        listing: {
          ...item.listing,
          priceKobo: item.listing.priceKobo.toString(),
        },
      })),
    });
  } catch (error) {
    console.error("Failed to fetch cart:", error);
    return NextResponse.json({ error: "Failed to fetch cart. Please try again." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const listingId = json?.listingId;
  if (typeof listingId !== "string") {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  try {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== "ACTIVE") {
      return NextResponse.json({ error: "Listing is not available" }, { status: 404 });
    }
    if (listing.sellerId === session.user.id) {
      return NextResponse.json({ error: "You can't add your own listing to cart" }, { status: 400 });
    }

    await prisma.cartItem.upsert({
      where: { userId_listingId: { userId: session.user.id, listingId } },
      create: { userId: session.user.id, listingId },
      update: {},
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to add to cart:", error);
    return NextResponse.json({ error: "Failed to add to cart. Please try again." }, { status: 500 });
  }
}

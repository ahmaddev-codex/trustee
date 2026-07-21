import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createListingSchema } from "@/lib/validations/listing";
import { nairaToKobo } from "@/lib/money";

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

  const listing = await prisma.listing.create({
    data: {
      sellerId: session.user.id,
      title,
      description,
      priceKobo: nairaToKobo(priceNaira),
      category,
      imageUrls,
    },
  });

  return NextResponse.json(
    { listing: { ...listing, priceKobo: listing.priceKobo.toString() } },
    { status: 201 },
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listings = await prisma.listing.findMany({
    where: { sellerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    listings: listings.map((l) => ({ ...l, priceKobo: l.priceKobo.toString() })),
  });
}

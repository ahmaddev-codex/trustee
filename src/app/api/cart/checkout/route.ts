import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computePlatformFeeKobo } from "@/lib/fees";
import { koboToNairaAmount } from "@/lib/money";
import { initializeTransaction, MonnifyError } from "@/lib/monnify";

const LISTING_UNAVAILABLE = "LISTING_UNAVAILABLE";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const listingIds = json?.listingIds;
  if (!Array.isArray(listingIds) || listingIds.length === 0 || !listingIds.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "Select at least one item to check out" }, { status: 400 });
  }

  try {
    // Only listings that are actually in the buyer's cart can be checked out —
    // this also confirms none of them are the buyer's own listing (cart adds
    // already reject that).
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id, listingId: { in: listingIds } },
      include: { listing: true },
    });

    if (cartItems.length !== listingIds.length) {
      return NextResponse.json(
        { error: "Some selected items are no longer in your cart" },
        { status: 409 },
      );
    }

    const unavailable = cartItems.filter((item) => item.listing.status !== "ACTIVE");
    if (unavailable.length > 0) {
      return NextResponse.json(
        {
          error: `No longer available: ${unavailable.map((i) => i.listing.title).join(", ")}`,
        },
        { status: 409 },
      );
    }

    const paymentReference = `trustee-cart-${randomUUID()}`;

    // Reserve every listing and create every order atomically — if any listing
    // was bought out from under this cart between page-load and checkout, the
    // whole checkout rolls back rather than partially succeeding.
    const orders = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const item of cartItems) {
        const reserved = await tx.listing.updateMany({
          where: { id: item.listing.id, status: "ACTIVE" },
          data: { status: "SOLD" },
        });
        if (reserved.count === 0) {
          throw new Error(LISTING_UNAVAILABLE);
        }

        const platformFeeKobo = computePlatformFeeKobo(item.listing.priceKobo);
        created.push(
          await tx.order.create({
            data: {
              listingId: item.listing.id,
              buyerId: session.user.id,
              sellerId: item.listing.sellerId,
              amountKobo: item.listing.priceKobo,
              platformFeeKobo,
              monnifyPaymentReference: paymentReference,
            },
          }),
        );
      }

      await tx.cartItem.deleteMany({
        where: { userId: session.user.id, listingId: { in: listingIds } },
      });

      return created;
    });

    const totalKobo = orders.reduce((sum, o) => sum + o.amountKobo, 0n);

    try {
      const { checkoutUrl, transactionReference } = await initializeTransaction({
        amount: koboToNairaAmount(totalKobo),
        customerName: session.user.name ?? "Trustee buyer",
        customerEmail: session.user.email ?? "",
        paymentReference,
        paymentDescription: `${orders.length} item(s) from your cart`,
        redirectUrl: `${process.env.NEXTAUTH_URL}/cart/checkout-success?ref=${encodeURIComponent(paymentReference)}`,
      });

      await prisma.order.updateMany({
        where: { monnifyPaymentReference: paymentReference },
        data: { monnifyTransactionRef: transactionReference },
      });

      return NextResponse.json({ checkoutUrl }, { status: 201 });
    } catch (error) {
      // Checkout never actually started — release every reserved listing and
      // cancel every order, same as the single-item flow's failure path.
      await prisma.$transaction([
        prisma.order.updateMany({
          where: { monnifyPaymentReference: paymentReference },
          data: { status: "CANCELLED" },
        }),
        prisma.listing.updateMany({
          where: { id: { in: cartItems.map((i) => i.listing.id) } },
          data: { status: "ACTIVE" },
        }),
      ]);

      const message = error instanceof MonnifyError ? error.message : "Could not start checkout";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (error) {
    if (error instanceof Error && error.message === LISTING_UNAVAILABLE) {
      return NextResponse.json(
        { error: "One of the selected items was just bought by someone else. Refresh your cart and try again." },
        { status: 409 },
      );
    }
    console.error("Failed to check out cart:", error);
    return NextResponse.json(
      { error: "Failed to check out. Please try again." },
      { status: 500 },
    );
  }
}

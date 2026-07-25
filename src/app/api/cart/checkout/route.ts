import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reserveAndCreateOrders, ListingUnavailableError } from "@/lib/create-orders";
import { koboToNairaAmount } from "@/lib/money";
import { initializeTransaction, MonnifyError } from "@/lib/monnify";

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
    // Only listings actually in the buyer's cart can be checked out (cart
    // adds already reject the buyer's own listings).
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

    // Reserve every listing and create one order per seller, atomically — if
    // any listing sold out from under this cart, the whole checkout rolls back.
    const orders = await prisma.$transaction(async (tx) => {
      const created = await reserveAndCreateOrders(
        tx,
        session.user.id,
        cartItems.map((item) => ({
          listingId: item.listing.id,
          sellerId: item.listing.sellerId,
          priceKobo: item.listing.priceKobo,
        })),
        paymentReference,
      );

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
        paymentDescription: `${cartItems.length} item(s) from your cart`,
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
    if (error instanceof ListingUnavailableError) {
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

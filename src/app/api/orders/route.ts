import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reserveAndCreateOrders, ListingUnavailableError } from "@/lib/create-orders";
import { koboToNairaAmount } from "@/lib/money";
import { isCheckoutExpired } from "@/lib/escrow";
import { initializeTransaction, MonnifyError } from "@/lib/monnify";

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
    if (!listing) {
      return NextResponse.json({ error: "Listing is not available" }, { status: 404 });
    }
    if (listing.sellerId === session.user.id) {
      return NextResponse.json({ error: "You can't buy your own listing" }, { status: 400 });
    }

    // An abandoned checkout can leave a listing reserved with no paid order -
    // free it (and any sibling listings from the same stale order) once the window passes.
    if (listing.status !== "ACTIVE") {
      const staleOrder = await prisma.order.findFirst({
        where: { status: "AWAITING_PAYMENT", items: { some: { listingId: listing.id } } },
        include: { items: true },
        orderBy: { createdAt: "desc" },
      });
      const canReclaim = staleOrder && isCheckoutExpired(staleOrder.createdAt);
      if (canReclaim) {
        await prisma.$transaction([
          prisma.order.update({ where: { id: staleOrder.id }, data: { status: "CANCELLED" } }),
          prisma.listing.updateMany({
            where: { id: { in: staleOrder.items.map((item) => item.listingId) } },
            data: { status: "ACTIVE" },
          }),
        ]);
      } else {
        return NextResponse.json({ error: "Listing is not available" }, { status: 404 });
      }
    }

    const paymentReference = `trustee-buynow-${randomUUID()}`;

    // Reserve the listing and create the order atomically - the status guard
    // stops two buyers from paying for the same listing.
    const [order] = await prisma.$transaction((tx) =>
      reserveAndCreateOrders(
        tx,
        session.user.id,
        [{ listingId: listing.id, sellerId: listing.sellerId, priceKobo: listing.priceKobo }],
        paymentReference,
      ),
    );

    try {
      const { checkoutUrl, transactionReference } = await initializeTransaction({
        amount: koboToNairaAmount(listing.priceKobo),
        customerName: session.user.name ?? "Trustee buyer",
        customerEmail: session.user.email ?? "",
        paymentReference,
        paymentDescription: listing.title,
        redirectUrl: `${process.env.NEXTAUTH_URL}/orders/${order.id}`,
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { monnifyTransactionRef: transactionReference },
      });

      return NextResponse.json({ order: { id: order.id }, checkoutUrl }, { status: 201 });
    } catch (error) {
      // Checkout never actually started - release the listing back to the
      // market along with cancelling the order.
      await prisma.$transaction([
        prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } }),
        prisma.listing.update({ where: { id: listing.id }, data: { status: "ACTIVE" } }),
      ]);

      const message = error instanceof MonnifyError ? error.message : "Could not start checkout";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (error) {
    if (error instanceof ListingUnavailableError) {
      return NextResponse.json({ error: "Listing is not available" }, { status: 409 });
    }
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 },
    );
  }
}

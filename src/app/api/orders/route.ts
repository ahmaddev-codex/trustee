import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computePlatformFeeKobo } from "@/lib/fees";
import { koboToNairaAmount } from "@/lib/money";
import { isCheckoutExpired } from "@/lib/escrow";
import { initializeTransaction, MonnifyError } from "@/lib/monnify";

const LISTING_UNAVAILABLE = "LISTING_UNAVAILABLE";

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

    // An abandoned checkout can leave a listing reserved (SOLD) with no order
    // that ever got paid — free it up once the reservation window has passed
    // instead of blocking it forever.
    if (listing.status !== "ACTIVE") {
      const staleOrder = await prisma.order.findFirst({
        where: { listingId: listing.id, status: "AWAITING_PAYMENT" },
        orderBy: { createdAt: "desc" },
      });
      const canReclaim = staleOrder && isCheckoutExpired(staleOrder.createdAt);
      if (canReclaim) {
        await prisma.$transaction([
          prisma.order.update({ where: { id: staleOrder.id }, data: { status: "CANCELLED" } }),
          prisma.listing.update({ where: { id: listing.id }, data: { status: "ACTIVE" } }),
        ]);
      } else {
        return NextResponse.json({ error: "Listing is not available" }, { status: 404 });
      }
    }

    const platformFeeKobo = computePlatformFeeKobo(listing.priceKobo);

    // Reserve the listing and create the order atomically: the updateMany's
    // status guard means only one concurrent request can flip ACTIVE → SOLD,
    // so two buyers can never both pay for the same listing.
    const order = await prisma.$transaction(async (tx) => {
      const reserved = await tx.listing.updateMany({
        where: { id: listing.id, status: "ACTIVE" },
        data: { status: "SOLD" },
      });
      if (reserved.count === 0) {
        throw new Error(LISTING_UNAVAILABLE);
      }

      return tx.order.create({
        data: {
          listingId: listing.id,
          buyerId: session.user.id,
          sellerId: listing.sellerId,
          amountKobo: listing.priceKobo,
          platformFeeKobo,
          // Placeholder — replaced with the real order-scoped reference below.
          monnifyPaymentReference: `pending-${listing.id}-${session.user.id}-${Date.now()}`,
        },
      });
    });

    const paymentReference = `trustee-${order.id}`;

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
        data: { monnifyPaymentReference: paymentReference, monnifyTransactionRef: transactionReference },
      });

      return NextResponse.json({ order: { id: order.id }, checkoutUrl }, { status: 201 });
    } catch (error) {
      // Checkout never actually started — release the listing back to the
      // market along with cancelling the order.
      await prisma.$transaction([
        prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } }),
        prisma.listing.update({ where: { id: listing.id }, data: { status: "ACTIVE" } }),
      ]);

      const message = error instanceof MonnifyError ? error.message : "Could not start checkout";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (error) {
    if (error instanceof Error && error.message === LISTING_UNAVAILABLE) {
      return NextResponse.json({ error: "Listing is not available" }, { status: 409 });
    }
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 },
    );
  }
}

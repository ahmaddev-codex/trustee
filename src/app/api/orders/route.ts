import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computePlatformFeeKobo } from "@/lib/fees";
import { koboToNairaAmount } from "@/lib/money";
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
    if (!listing || listing.status !== "ACTIVE") {
      return NextResponse.json({ error: "Listing is not available" }, { status: 404 });
    }
    if (listing.sellerId === session.user.id) {
      return NextResponse.json({ error: "You can't buy your own listing" }, { status: 400 });
    }

    const platformFeeKobo = computePlatformFeeKobo(listing.priceKobo);

    const order = await prisma.order.create({
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
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });

      const message = error instanceof MonnifyError ? error.message : "Could not start checkout";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: "Failed to create order. Please try again." },
      { status: 500 },
    );
  }
}

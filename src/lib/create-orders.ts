import type { Order, Prisma } from "@prisma/client";

import { computePlatformFeeKobo } from "./fees";

export type ReserveItem = {
  listingId: string;
  sellerId: string;
  priceKobo: bigint;
};

// Thrown when a listing was bought out from under the buyer between
// page-load and checkout (caught by callers to return a 409).
export class ListingUnavailableError extends Error {
  constructor() {
    super("LISTING_UNAVAILABLE");
  }
}

// Reserves every listing and creates one Order per seller (grouping same-
// seller items into one order/receipt), all within the caller's transaction.
export async function reserveAndCreateOrders(
  tx: Prisma.TransactionClient,
  buyerId: string,
  items: ReserveItem[],
  paymentReference: string,
): Promise<Order[]> {
  const bySeller = new Map<string, ReserveItem[]>();
  for (const item of items) {
    const group = bySeller.get(item.sellerId) ?? [];
    group.push(item);
    bySeller.set(item.sellerId, group);
  }

  const orders: Order[] = [];
  for (const [sellerId, sellerItems] of bySeller) {
    for (const item of sellerItems) {
      const reserved = await tx.listing.updateMany({
        where: { id: item.listingId, status: "ACTIVE" },
        data: { status: "SOLD" },
      });
      if (reserved.count === 0) {
        throw new ListingUnavailableError();
      }
    }

    const amountKobo = sellerItems.reduce((sum, item) => sum + item.priceKobo, 0n);
    const platformFeeKobo = computePlatformFeeKobo(amountKobo);

    const order = await tx.order.create({
      data: {
        buyerId,
        sellerId,
        amountKobo,
        platformFeeKobo,
        monnifyPaymentReference: paymentReference,
        items: {
          create: sellerItems.map((item) => ({
            listingId: item.listingId,
            priceKobo: item.priceKobo,
          })),
        },
      },
    });

    orders.push(order);
  }

  return orders;
}

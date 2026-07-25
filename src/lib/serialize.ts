import type { Order } from "@prisma/client";

// NextResponse.json() can't serialize BigInt, and Order stores amounts as
// BigInt (kobo) — every Order response must go through this first.
export function serializeOrder(order: Order) {
  return {
    ...order,
    amountKobo: order.amountKobo.toString(),
    platformFeeKobo: order.platformFeeKobo.toString(),
  };
}

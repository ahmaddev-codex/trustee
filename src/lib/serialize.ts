import type { Order } from "@/generated/prisma/client";

// NextResponse.json() calls JSON.stringify, which can't serialize BigInt —
// Prisma's Order model stores amounts as BigInt (kobo), so every route
// response including an Order must go through this first.
export function serializeOrder(order: Order) {
  return {
    ...order,
    amountKobo: order.amountKobo.toString(),
    platformFeeKobo: order.platformFeeKobo.toString(),
  };
}

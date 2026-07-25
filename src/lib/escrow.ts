const AUTO_RELEASE_DAYS = Number(process.env.AUTO_RELEASE_DAYS ?? "5");
const SHIPPING_GRACE_DAYS = Number(process.env.SHIPPING_GRACE_DAYS ?? "3");
const CHECKOUT_EXPIRY_MINUTES = Number(process.env.CHECKOUT_EXPIRY_MINUTES ?? "30");

export function autoReleaseDeadline(shippedAt: Date): Date {
  return new Date(shippedAt.getTime() + AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000);
}

export function refundEligibleAt(fundedAt: Date): Date {
  return new Date(fundedAt.getTime() + SHIPPING_GRACE_DAYS * 24 * 60 * 60 * 1000);
}

// A listing is reserved (SOLD) the moment checkout starts — this is how long
// an abandoned Monnify checkout holds before another buyer can reclaim it.
export function isCheckoutExpired(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() > CHECKOUT_EXPIRY_MINUTES * 60 * 1000;
}

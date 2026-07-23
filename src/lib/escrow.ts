const AUTO_RELEASE_DAYS = Number(process.env.AUTO_RELEASE_DAYS ?? "5");
const SHIPPING_GRACE_DAYS = Number(process.env.SHIPPING_GRACE_DAYS ?? "3");
const CHECKOUT_EXPIRY_MINUTES = Number(process.env.CHECKOUT_EXPIRY_MINUTES ?? "30");

export function autoReleaseDeadline(shippedAt: Date): Date {
  return new Date(shippedAt.getTime() + AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000);
}

export function refundEligibleAt(fundedAt: Date): Date {
  return new Date(fundedAt.getTime() + SHIPPING_GRACE_DAYS * 24 * 60 * 60 * 1000);
}

// A listing is reserved (flipped to SOLD) the moment a buyer starts checkout, so
// a second buyer can't also pay for it. If they abandon the Monnify checkout
// page and never come back, this is how long the reservation holds before
// another buyer is allowed to reclaim the listing.
export function isCheckoutExpired(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() > CHECKOUT_EXPIRY_MINUTES * 60 * 1000;
}

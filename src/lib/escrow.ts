const AUTO_RELEASE_DAYS = Number(process.env.AUTO_RELEASE_DAYS ?? "5");
const SHIPPING_GRACE_DAYS = Number(process.env.SHIPPING_GRACE_DAYS ?? "3");

export function autoReleaseDeadline(shippedAt: Date): Date {
  return new Date(shippedAt.getTime() + AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000);
}

export function refundEligibleAt(fundedAt: Date): Date {
  return new Date(fundedAt.getTime() + SHIPPING_GRACE_DAYS * 24 * 60 * 60 * 1000);
}

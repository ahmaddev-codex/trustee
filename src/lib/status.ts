export const orderStatusCopy: Record<string, { label: string; description: string }> = {
  AWAITING_PAYMENT: {
    label: "Awaiting payment",
    description: "Waiting for the buyer's payment to be confirmed.",
  },
  FUNDED: {
    label: "Funds in escrow",
    description: "Payment received and held by Trustee. Waiting for the seller to ship.",
  },
  SHIPPED: {
    label: "Shipped",
    description: "The seller marked this as shipped. Funds release when the buyer confirms.",
  },
  RELEASED: {
    label: "Released",
    description: "Funds have been released to the seller.",
  },
  DISPUTED: {
    label: "Disputed",
    description: "This order is under review by Trustee.",
  },
  REFUNDED: {
    label: "Refunded",
    description: "Funds were refunded to the buyer.",
  },
  CANCELLED: {
    label: "Cancelled",
    description: "This order was cancelled before payment completed.",
  },
};

export const listingStatusLabel: Record<string, string> = {
  ACTIVE: "Active",
  SOLD: "Sold",
  REMOVED: "Removed",
};

export const autoReleaseNote =
  "If you don't confirm or raise a dispute by this date, funds release to the seller automatically.";

export const refundEligibleNote =
  "If the seller hasn't shipped by this date, you can request a refund yourself.";

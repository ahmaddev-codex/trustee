import type { Order, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { koboToNairaAmount } from "@/lib/money";
import { initiateSingleTransfer } from "@/lib/monnify";
import { notify, notifyAdmins } from "@/lib/notifications";
import { orderSummaryTitle } from "@/lib/order-summary";

export interface ReleaseResult {
  order: Order;
  transferStatus: string;
  pendingAuthorization: boolean;
}

type ReleasableOrder = Order & {
  seller: User;
  items: { listing: { title: string; imageUrls: string[] } }[];
};

// Shared by the buyer's "Confirm receipt" action and the auto-release check
// once autoReleaseAt passes — both settle the same payout to the seller.
export async function releaseFundsToSeller(order: ReleasableOrder): Promise<ReleaseResult> {
  const { seller } = order;
  if (!seller.bankAccountNumber || !seller.bankCode || !seller.bankAccountName) {
    throw new Error("The seller hasn't added a verified payout account yet");
  }

  const title = orderSummaryTitle(order.items);
  const payoutKobo = order.amountKobo - order.platformFeeKobo;
  const reference = `payout-${order.id}`;

  const transfer = await initiateSingleTransfer({
    amount: koboToNairaAmount(payoutKobo),
    reference,
    narration: `Trustee payout — ${title}`,
    destinationBankCode: seller.bankCode,
    destinationAccountNumber: seller.bankAccountNumber,
    destinationAccountName: seller.bankAccountName,
  });

  const isComplete = transfer.status === "SUCCESS" || transfer.status === "COMPLETED";

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      monnifyDisbursementRef: reference,
      ...(isComplete ? { status: "RELEASED", releasedAt: new Date() } : {}),
    },
  });

  if (isComplete) {
    await notify({
      userId: order.sellerId,
      type: "PAYOUT_RELEASED",
      title: "Payment released to you",
      body: `Your payout for "${title}" has been sent.`,
      link: `/orders/${order.id}`,
    });
  } else {
    await notify({
      userId: order.sellerId,
      type: "PAYOUT_PENDING",
      title: "Payout pending authorization",
      body: `Your payout for "${title}" is awaiting admin authorization.`,
      link: `/orders/${order.id}`,
    });
    await notifyAdmins({
      type: "PAYOUT_NEEDS_AUTH",
      title: "Payout needs OTP authorization",
      body: `Payout for "${title}" is pending authorization.`,
      link: "/dashboard?tab=payouts",
    });
  }

  return { order: updated, transferStatus: transfer.status, pendingAuthorization: !isComplete };
}

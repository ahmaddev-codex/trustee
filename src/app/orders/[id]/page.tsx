import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { verifyTransactionByPaymentReference } from "@/lib/monnify";
import { autoReleaseDeadline, refundEligibleAt } from "@/lib/escrow";
import { Badge } from "@/components/ui/badge";
import { OrderActions } from "./order-actions";

export const dynamic = "force-dynamic";

const statusCopy: Record<string, { label: string; description: string }> = {
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

export default async function OrderDetailPage({
  params,
}: PageProps<"/orders/[id]">) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/orders/${id}`);

  let order = await prisma.order.findUnique({
    where: { id },
    include: {
      listing: { select: { title: true, imageUrls: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
  });

  if (!order) notFound();

  const isBuyer = order.buyerId === session.user.id;
  const isSeller = order.sellerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isBuyer && !isSeller && !isAdmin) notFound();

  // Belt-and-suspenders: the buyer's redirect back from Monnify's checkout
  // may land here before the webhook has been delivered.
  if (order.status === "AWAITING_PAYMENT") {
    try {
      const verified = await verifyTransactionByPaymentReference(order.monnifyPaymentReference);
      if (verified.paymentStatus === "PAID") {
        order = await prisma.order.update({
          where: { id: order.id },
          data: { status: "FUNDED", fundedAt: new Date() },
          include: {
            listing: { select: { title: true, imageUrls: true } },
            buyer: { select: { id: true, name: true } },
            seller: { select: { id: true, name: true } },
          },
        });
      }
    } catch {
      // Not paid yet, or Monnify is unreachable — the buyer can retry from here.
    }
  }

  const copy = statusCopy[order.status] ?? { label: order.status, description: "" };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {order.listing.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isBuyer ? `Sold by ${order.seller.name}` : `Bought by ${order.buyer.name}`}
          </p>
        </div>
        <Badge className="rounded-full">{copy.label}</Badge>
      </div>

      <div className="rounded-2xl border p-5">
        <p className="text-muted-foreground">{copy.description}</p>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Item price</dt>
            <dd className="font-medium">{formatNaira(order.amountKobo)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Platform fee</dt>
            <dd className="font-medium">{formatNaira(order.platformFeeKobo)}</dd>
          </div>
          {order.shippedAt && (
            <div>
              <dt className="text-muted-foreground">Shipped</dt>
              <dd className="font-medium">{order.shippedAt.toLocaleDateString()}</dd>
            </div>
          )}
          {order.status === "SHIPPED" && order.shippedAt && (
            <div>
              <dt className="text-muted-foreground">Auto-releases</dt>
              <dd className="font-medium">
                {autoReleaseDeadline(order.shippedAt).toLocaleDateString()}
              </dd>
            </div>
          )}
          {order.status === "FUNDED" && order.fundedAt && (
            <div>
              <dt className="text-muted-foreground">Refund eligible from</dt>
              <dd className="font-medium">
                {refundEligibleAt(order.fundedAt).toLocaleDateString()}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6">
          <OrderActions
            orderId={order.id}
            status={order.status}
            isBuyer={isBuyer}
            isSeller={isSeller}
          />
        </div>
      </div>
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TbCircleCheck, TbCircle, TbShieldExclamation, TbArrowLeft } from "react-icons/tb";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { verifyTransactionByPaymentReference } from "@/lib/monnify";
import { autoReleaseDeadline, refundEligibleAt } from "@/lib/escrow";
import { releaseFundsToSeller } from "@/lib/release";
import { orderStatusCopy, autoReleaseNote, refundEligibleNote } from "@/lib/status";
import { notify } from "@/lib/notifications";
import { Badge } from "@/components/ui/badge";
import { OrderActions } from "./order-actions";
import { PageContainer } from "@/components/page-container";

export const dynamic = "force-dynamic";

const statusCopy = orderStatusCopy;

const happyPathSteps = [
  { key: "FUNDED", label: "Paid" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "RELEASED", label: "Confirmed" },
];

const branchStatus: Record<string, { label: string; tone: string }> = {
  DISPUTED: { label: "Under review", tone: "text-destructive" },
  REFUNDED: { label: "Refunded", tone: "text-muted-foreground" },
  CANCELLED: { label: "Cancelled", tone: "text-muted-foreground" },
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
        await notify({
          userId: order.sellerId,
          type: "ORDER_FUNDED",
          title: "Your item sold",
          body: `Payment received for "${order.listing.title}" — mark it shipped when it's on its way.`,
          link: `/orders/${order.id}`,
        });
      }
    } catch {
      // Not paid yet, or Monnify is unreachable — the buyer can retry from here.
    }
  }

  // Same belt-and-suspenders pattern as above: if the buyer never confirms or
  // disputes, whoever next opens this page past the auto-release deadline
  // triggers the payout automatically instead of the funds sitting in escrow
  // forever.
  if (
    order.status === "SHIPPED" &&
    order.autoReleaseAt &&
    new Date() >= order.autoReleaseAt
  ) {
    try {
      const releasable = await prisma.order.findUnique({
        where: { id: order.id },
        include: { seller: true, listing: { select: { title: true } } },
      });
      if (
        releasable &&
        releasable.status === "SHIPPED" &&
        releasable.seller.bankAccountNumber &&
        releasable.seller.bankCode &&
        releasable.seller.bankAccountName
      ) {
        await releaseFundsToSeller(releasable);
        order = await prisma.order.findUnique({
          where: { id },
          include: {
            listing: { select: { title: true, imageUrls: true } },
            buyer: { select: { id: true, name: true } },
            seller: { select: { id: true, name: true } },
          },
        });
      }
    } catch {
      // Monnify unreachable, disbursements not enabled yet, or seller has no
      // payout account — the buyer can still confirm manually once resolved.
    }
  }

  if (!order) notFound();

  const copy = statusCopy[order.status] ?? { label: order.status, description: "" };

  return (
    <PageContainer className="py-6 sm:py-8">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <TbArrowLeft className="size-4" />
        Back to Dashboard
      </Link>

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

      {branchStatus[order.status] ? (
        <div
          className={`mb-6 flex items-center gap-2 rounded-xl border p-3 text-sm font-medium ${branchStatus[order.status].tone}`}
        >
          <TbShieldExclamation className="size-4 shrink-0" />
          {branchStatus[order.status].label}
        </div>
      ) : (
        <div className="mb-6 flex items-center" aria-label="Order progress">
          {happyPathSteps.map((step, i) => {
            const done =
              step.key === "FUNDED"
                ? !!order.fundedAt
                : step.key === "SHIPPED"
                  ? !!order.shippedAt
                  : order.status === "RELEASED";
            return (
              <div key={step.key} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  {done ? (
                    <TbCircleCheck className="size-5 text-brand" />
                  ) : (
                    <TbCircle className="size-5 text-muted-foreground/40" />
                  )}
                  <span
                    className={`text-xs ${done ? "font-medium text-foreground" : "text-muted-foreground"}`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < happyPathSteps.length - 1 && (
                  <div className={`mx-2 h-px flex-1 ${done ? "bg-brand" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border p-5">
        <p className="text-muted-foreground">{copy.description}</p>

        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Item price</dt>
            <dd className="font-display font-medium">{formatNaira(order.amountKobo)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Platform fee</dt>
            <dd className="font-display font-medium">{formatNaira(order.platformFeeKobo)}</dd>
          </div>
          {order.shippedAt && (
            <div>
              <dt className="text-muted-foreground">Shipped</dt>
              <dd className="font-medium">{order.shippedAt.toLocaleDateString()}</dd>
            </div>
          )}
          {order.status === "SHIPPED" && order.shippedAt && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Auto-releases</dt>
              <dd className="font-medium">
                {autoReleaseDeadline(order.shippedAt).toLocaleDateString()}
              </dd>
              <dd className="mt-0.5 text-xs text-muted-foreground">{autoReleaseNote}</dd>
            </div>
          )}
          {order.status === "FUNDED" && order.fundedAt && (
            <div className="col-span-2">
              <dt className="text-muted-foreground">Refund eligible from</dt>
              <dd className="font-medium">
                {refundEligibleAt(order.fundedAt).toLocaleDateString()}
              </dd>
              <dd className="mt-0.5 text-xs text-muted-foreground">{refundEligibleNote}</dd>
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
    </PageContainer>
  );
}

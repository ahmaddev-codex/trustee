import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TbCircleCheck } from "react-icons/tb";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { fundOrdersByPaymentReference } from "@/lib/fund-orders";
import { Badge } from "@/components/ui/badge";
import { orderStatusCopy } from "@/lib/status";
import { PageContainer } from "@/components/page-container";

export const dynamic = "force-dynamic";

export default async function CartCheckoutSuccessPage({
  searchParams,
}: PageProps<"/cart/checkout-success">) {
  const { ref } = await searchParams;
  const paymentReference = typeof ref === "string" ? ref : undefined;
  if (!paymentReference) notFound();

  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/cart/checkout-success?ref=${encodeURIComponent(paymentReference)}`);

  let orders = await prisma.order.findMany({
    where: { monnifyPaymentReference: paymentReference, buyerId: session.user.id },
    include: { listing: { select: { title: true, imageUrls: true } }, seller: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (orders.length === 0) notFound();

  // Belt-and-suspenders: the buyer's redirect back from Monnify's checkout may
  // land here before the webhook has been delivered.
  if (orders.some((order) => order.status === "AWAITING_PAYMENT")) {
    try {
      await fundOrdersByPaymentReference(paymentReference);
    } catch {
      // Not paid yet, or Monnify is unreachable — the buyer can retry from here.
    }
    orders = await prisma.order.findMany({
      where: { monnifyPaymentReference: paymentReference, buyerId: session.user.id },
      include: { listing: { select: { title: true, imageUrls: true } }, seller: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  const allFunded = orders.every((order) => order.status !== "AWAITING_PAYMENT");
  const totalKobo = orders.reduce((sum, order) => sum + order.amountKobo, 0n);

  return (
    <PageContainer className="py-6 sm:py-8">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        {allFunded ? (
          <>
            <TbCircleCheck className="size-10 text-brand" />
            <h1 className="font-display text-2xl font-bold tracking-tight">Payment received</h1>
            <p className="text-sm text-muted-foreground">
              {orders.length} item{orders.length === 1 ? "" : "s"} for {formatNaira(totalKobo)} — funds are held in
              escrow until each seller ships and you confirm.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold tracking-tight">Confirming your payment…</h1>
            <p className="text-sm text-muted-foreground">
              We haven&apos;t heard back from Monnify yet. Refresh this page in a moment — you won&apos;t be
              charged twice.
            </p>
          </>
        )}
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const copy = orderStatusCopy[order.status] ?? { label: order.status, description: "" };
          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between rounded-2xl border p-4 transition-colors hover:bg-muted/50"
            >
              <div>
                <p className="font-medium">{order.listing.title}</p>
                <p className="text-sm text-muted-foreground">Sold by {order.seller.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-sm font-medium">{formatNaira(order.amountKobo)}</span>
                <Badge className="rounded-full">{copy.label}</Badge>
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/marketplace"
        className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        Continue browsing
      </Link>
    </PageContainer>
  );
}

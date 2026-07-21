import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthorizeForm } from "./authorize-form";
import { ResolveDisputeForm } from "./resolve-dispute-form";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [pending, disputes] = await Promise.all([
    prisma.order.findMany({
      where: {
        monnifyDisbursementRef: { not: null },
        releasedAt: null,
        refundedAt: null,
      },
      include: { listing: { select: { title: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.dispute.findMany({
      where: { status: "OPEN" },
      include: {
        order: { include: { listing: { select: { title: true } }, buyer: true, seller: true } },
        raisedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      <div>
        <h1 className="mb-1 font-display text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Payout authorizations and dispute resolution.
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">
          Pending payout authorizations ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing waiting on an OTP right now.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <CardTitle className="text-base">{order.listing.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Reference: {order.monnifyDisbursementRef} ·{" "}
                    {formatNaira(order.amountKobo - order.platformFeeKobo)}
                  </p>
                  <AuthorizeForm reference={order.monnifyDisbursementRef!} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">
          Open disputes ({disputes.length})
        </h2>
        {disputes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open disputes.</p>
        ) : (
          <div className="space-y-3">
            {disputes.map((dispute) => (
              <Card key={dispute.id}>
                <CardHeader>
                  <CardTitle className="text-base">{dispute.order.listing.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">
                    <span className="font-medium">{dispute.raisedBy.name}</span> said:{" "}
                    {dispute.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Buyer: {dispute.order.buyer.name} · Seller: {dispute.order.seller.name} ·{" "}
                    {formatNaira(dispute.order.amountKobo)}
                  </p>
                  <ResolveDisputeForm disputeId={dispute.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

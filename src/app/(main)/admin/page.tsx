import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthorizeForm } from "./authorize-form";
import { ResolveDisputeForm } from "./resolve-dispute-form";
import { ModerateListingForm } from "./moderate-listing-form";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [pending, disputes, flaggedListings, payoutAccounts] = await Promise.all([
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
    prisma.listing.findMany({
      where: { aiFlagged: true, status: "ACTIVE" },
      include: { seller: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { bankAccountName: { not: null } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bankAccountName: true,
        bankAccountNumber: true,
        bankCode: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Control room</h1>
        <p className="mt-1 text-sm text-muted-foreground">
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
          Connected payout accounts ({payoutAccounts.length})
        </h2>
        {payoutAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No one has connected a payout account yet.
          </p>
        ) : (
          <div className="space-y-2">
            {payoutAccounts.map((user) => (
              <Card key={user.id}>
                <CardContent className="flex items-center justify-between gap-3 py-4">
                  <div>
                    <p className="text-sm font-medium">
                      {user.name}{" "}
                      <span className="font-normal text-muted-foreground">({user.email})</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.bankAccountName} · Bank {user.bankCode} · •••• {user.bankAccountNumber?.slice(-4)}
                    </p>
                  </div>
                  {user.role === "ADMIN" && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                      Admin
                    </span>
                  )}
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

      <section>
        <h2 className="mb-3 font-display text-lg font-bold">
          AI-flagged listings ({flaggedListings.length})
        </h2>
        {flaggedListings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing flagged for scam signals right now.
          </p>
        ) : (
          <div className="space-y-3">
            {flaggedListings.map((listing) => (
              <Card key={listing.id}>
                <CardHeader>
                  <CardTitle className="text-base">{listing.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Seller: {listing.seller.name} · {formatNaira(listing.priceKobo)}
                  </p>
                  <p className="text-sm">{listing.aiFlagReason}</p>
                  <ModerateListingForm listingId={listing.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

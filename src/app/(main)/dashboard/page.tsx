import Link from "next/link";
import {
  TbShoppingBag,
  TbPhoto,
  TbCircleCheck,
  TbAlertCircle,
} from "react-icons/tb";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { orderStatusCopy, listingStatusLabel } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageWithSkeleton } from "@/components/image-with-skeleton";
import { DashboardSearch } from "./dashboard-search";
import { AdminSearchForm } from "./admin-search-form";
import { AuthorizeForm } from "./authorize-form";
import { ResolveDisputeForm } from "./resolve-dispute-form";
import { ModerateListingForm } from "./moderate-listing-form";
import { PayoutDetailsForm } from "./payout-details-form";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

const OPEN_ORDER_STATUSES = ["AWAITING_PAYMENT", "FUNDED", "SHIPPED", "DISPUTED"] as const;
const ADMIN_TABS = ["payouts", "disputes", "flagged", "settings"] as const;
const USER_TABS = ["listings", "buying", "selling", "payout", "settings"] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const isAdmin = session!.user.role === "ADMIN";

  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : "").trim();
  const rawTab = typeof params.tab === "string" ? params.tab : undefined;

  // Admins run escrow operations, not buy/sell — they get an entirely
  // different set of tabs and never touch the listings/buying/selling queries.
  if (isAdmin) {
    const tab = (ADMIN_TABS as readonly string[]).includes(rawTab ?? "")
      ? (rawTab as (typeof ADMIN_TABS)[number])
      : "payouts";
    return (
      <AdminDashboard
        q={q}
        tab={tab}
        name={session!.user.name ?? ""}
        email={session!.user.email ?? ""}
      />
    );
  }

  const tab = (USER_TABS as readonly string[]).includes(rawTab ?? "")
    ? (rawTab as (typeof USER_TABS)[number])
    : "listings";
  return (
    <UserDashboard
      userId={session!.user.id}
      q={q}
      tab={tab}
      name={session!.user.name ?? ""}
      email={session!.user.email ?? ""}
    />
  );
}

async function AdminDashboard({
  q,
  tab,
  name,
  email,
}: {
  q: string;
  tab: (typeof ADMIN_TABS)[number];
  name: string;
  email: string;
}) {
  const [
    pending,
    disputes,
    flaggedListings,
    payoutAccounts,
    matchedUsers,
    matchedListings,
    matchedOrders,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { monnifyDisbursementRef: { not: null }, releasedAt: null, refundedAt: null },
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
    q
      ? prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, email: true, role: true },
          take: 10,
        })
      : Promise.resolve([]),
    q
      ? prisma.listing.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { seller: { name: { contains: q, mode: "insensitive" } } },
            ],
          },
          include: { seller: { select: { name: true } } },
          take: 10,
        })
      : Promise.resolve([]),
    q
      ? prisma.order.findMany({
          where: {
            OR: [
              { id: q },
              { listing: { title: { contains: q, mode: "insensitive" } } },
              { buyer: { name: { contains: q, mode: "insensitive" } } },
              { seller: { name: { contains: q, mode: "insensitive" } } },
            ],
          },
          include: {
            listing: { select: { title: true } },
            buyer: { select: { name: true } },
            seller: { select: { name: true } },
          },
          take: 10,
        })
      : Promise.resolve([]),
  ]);

  const hasSearchResults =
    matchedUsers.length > 0 || matchedListings.length > 0 || matchedOrders.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Your activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Payout authorizations and dispute resolution.
        </p>
      </div>

      <div className="mb-6">
        <AdminSearchForm key={q} q={q} />
      </div>

      {q && (
        <div className="mb-8 space-y-4">
          {!hasSearchResults ? (
            <p className="text-sm text-muted-foreground">
              No users, listings, or orders match &quot;{q}&quot;.
            </p>
          ) : (
            <>
              {matchedUsers.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                    Users ({matchedUsers.length})
                  </p>
                  <div className="space-y-2">
                    {matchedUsers.map((user) => (
                      <Card key={user.id}>
                        <CardContent className="flex items-center justify-between gap-3 py-3">
                          <p className="text-sm">
                            <span className="font-medium">{user.name}</span>{" "}
                            <span className="text-muted-foreground">({user.email})</span>
                          </p>
                          {user.role === "ADMIN" && <Badge variant="secondary">Admin</Badge>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {matchedListings.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                    Listings ({matchedListings.length})
                  </p>
                  <div className="space-y-2">
                    {matchedListings.map((listing) => (
                      <Link key={listing.id} href={`/listings/${listing.id}`}>
                        <Card className="transition-shadow hover:shadow-md">
                          <CardContent className="flex items-center justify-between gap-3 py-3">
                            <p className="text-sm">
                              <span className="font-medium">{listing.title}</span>{" "}
                              <span className="text-muted-foreground">
                                · {listing.seller.name} · {formatNaira(listing.priceKobo)}
                              </span>
                            </p>
                            <Badge variant="secondary">{listing.status}</Badge>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {matchedOrders.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                    Orders ({matchedOrders.length})
                  </p>
                  <div className="space-y-2">
                    {matchedOrders.map((order) => (
                      <Link key={order.id} href={`/orders/${order.id}`}>
                        <Card className="transition-shadow hover:shadow-md">
                          <CardContent className="flex items-center justify-between gap-3 py-3">
                            <p className="text-sm">
                              <span className="font-medium">{order.listing.title}</span>{" "}
                              <span className="text-muted-foreground">
                                · {order.buyer.name} → {order.seller.name} ·{" "}
                                {formatNaira(order.amountKobo)}
                              </span>
                            </p>
                            <Badge variant="secondary">
                              {orderStatusCopy[order.status]?.label ?? order.status}
                            </Badge>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Tabs key={tab} defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="disputes">Disputes ({disputes.length})</TabsTrigger>
          <TabsTrigger value="flagged">Flagged ({flaggedListings.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="payouts" className="space-y-8 pt-4">
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
                          {user.bankAccountName} · Bank {user.bankCode} · ••••{" "}
                          {user.bankAccountNumber?.slice(-4)}
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
        </TabsContent>

        <TabsContent value="disputes" className="space-y-3 pt-4">
          {disputes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open disputes.</p>
          ) : (
            disputes.map((dispute) => (
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
            ))
          )}
        </TabsContent>

        <TabsContent value="flagged" className="space-y-3 pt-4">
          {flaggedListings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing flagged for scam signals right now.
            </p>
          ) : (
            flaggedListings.map((listing) => (
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
            ))
          )}
        </TabsContent>

        <TabsContent value="settings" className="pt-4">
          <SettingsForm name={name} email={email} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function UserDashboard({
  userId,
  q,
  tab,
  name,
  email,
}: {
  userId: string;
  q: string;
  tab: (typeof USER_TABS)[number];
  name: string;
  email: string;
}) {
  const titleFilter = q ? { contains: q, mode: "insensitive" as const } : undefined;

  const [
    listings,
    buying,
    selling,
    user,
    activeListingsCount,
    openPurchasesCount,
    openSalesCount,
  ] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: userId, ...(titleFilter ? { title: titleFilter } : {}) },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { buyerId: userId, ...(titleFilter ? { listing: { title: titleFilter } } : {}) },
      orderBy: { createdAt: "desc" },
      include: { listing: { select: { title: true, imageUrls: true } } },
    }),
    prisma.order.findMany({
      where: { sellerId: userId, ...(titleFilter ? { listing: { title: titleFilter } } : {}) },
      orderBy: { createdAt: "desc" },
      include: { listing: { select: { title: true, imageUrls: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { bankAccountName: true } }),
    // Stats always reflect everything, regardless of the current search —
    // otherwise "Active listings: 1" while searching would misleadingly read
    // as your whole inventory rather than just what matched.
    prisma.listing.count({ where: { sellerId: userId, status: "ACTIVE" } }),
    prisma.order.count({ where: { buyerId: userId, status: { in: [...OPEN_ORDER_STATUSES] } } }),
    prisma.order.count({ where: { sellerId: userId, status: { in: [...OPEN_ORDER_STATUSES] } } }),
  ]);

  const hasPayoutAccount = Boolean(user?.bankAccountName);

  const stats = [
    { label: "Active listings", value: activeListingsCount },
    { label: "Open purchases", value: openPurchasesCount },
    { label: "Open sales", value: openSalesCount },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Your activity</h1>
      </div>

      <div className="mb-6">
        <DashboardSearch key={q} q={q} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-background p-4">
            <p className="font-display text-2xl font-extrabold">{stat.value}</p>
            <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <Tabs key={tab} defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="listings">My listings</TabsTrigger>
          <TabsTrigger value="buying">Buying</TabsTrigger>
          <TabsTrigger value="selling">Selling</TabsTrigger>
          <TabsTrigger value="payout">
            {hasPayoutAccount ? (
              <TbCircleCheck className="size-3.5 text-green-600 dark:text-green-400" />
            ) : (
              <TbAlertCircle className="size-3.5 text-destructive" />
            )}
            Payout details
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-3 pt-4">
          {listings.length === 0 ? (
            q ? (
              <EmptyState message={`No listings match "${q}".`} href="/dashboard" cta="Clear search" />
            ) : (
              <EmptyState
                message="You haven't listed anything yet."
                href="/sell/new"
                cta="Create a listing"
              />
            )
          ) : (
            listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-3 py-4">
                    <div className="flex items-center gap-3">
                      <Thumbnail src={listing.imageUrls[0]} alt={listing.title} />
                      <div>
                        <p className="font-medium">{listing.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNaira(listing.priceKobo)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {listingStatusLabel[listing.status] ?? listing.status}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="buying" className="space-y-3 pt-4">
          {buying.length === 0 ? (
            q ? (
              <EmptyState message={`No purchases match "${q}".`} href="/dashboard" cta="Clear search" />
            ) : (
              <EmptyState
                message="You haven't bought anything yet."
                href="/marketplace"
                cta="Browse listings"
              />
            )
          ) : (
            buying.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-3 py-4">
                    <div className="flex items-center gap-3">
                      <Thumbnail src={order.listing.imageUrls[0]} alt={order.listing.title} />
                      <div>
                        <p className="font-medium">{order.listing.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNaira(order.amountKobo)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {orderStatusCopy[order.status]?.label ?? order.status}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="selling" className="space-y-3 pt-4">
          {selling.length === 0 ? (
            q ? (
              <EmptyState message={`No sales match "${q}".`} href="/dashboard" cta="Clear search" />
            ) : (
              <EmptyState message="No sales yet." href="/sell/new" cta="Create a listing" />
            )
          ) : (
            selling.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-3 py-4">
                    <div className="flex items-center gap-3">
                      <Thumbnail src={order.listing.imageUrls[0]} alt={order.listing.title} />
                      <div>
                        <p className="font-medium">{order.listing.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatNaira(order.amountKobo)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {orderStatusCopy[order.status]?.label ?? order.status}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="payout" className="pt-4">
          <PayoutDetailsForm />
        </TabsContent>

        <TabsContent value="settings" className="pt-4">
          <SettingsForm name={name} email={email} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Thumbnail({ src, alt }: { src?: string; alt: string }) {
  return (
    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
      {src ? (
        <ImageWithSkeleton src={src} alt={alt} />
      ) : (
        <div className="flex h-full items-center justify-center">
          <TbPhoto className="size-5 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

function EmptyState({ message, href, cta }: { message: string; href: string; cta: string }) {
  return (
    <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
      <TbShoppingBag className="mx-auto mb-3 size-7 text-muted-foreground/60" />
      {message}{" "}
      <Link href={href} className="underline underline-offset-4">
        {cta}
      </Link>
      .
    </div>
  );
}

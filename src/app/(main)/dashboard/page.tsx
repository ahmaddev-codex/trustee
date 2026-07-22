import Link from "next/link";
import Image from "next/image";
import { TbShoppingBag, TbPhoto, TbCircleCheck, TbAlertCircle } from "react-icons/tb";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { orderStatusCopy, listingStatusLabel } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [listings, buying, selling, user] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: "desc" },
      include: { listing: { select: { title: true, imageUrls: true } } },
    }),
    prisma.order.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      include: { listing: { select: { title: true, imageUrls: true } } },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { bankAccountName: true },
    }),
  ]);

  const hasPayoutAccount = Boolean(user?.bankAccountName);
  const isAdmin = session!.user.role === "ADMIN";

  const OPEN_ORDER_STATUSES = new Set(["AWAITING_PAYMENT", "FUNDED", "SHIPPED", "DISPUTED"]);
  const stats = [
    { label: "Active listings", value: listings.filter((l) => l.status === "ACTIVE").length },
    { label: "Open purchases", value: buying.filter((o) => OPEN_ORDER_STATUSES.has(o.status)).length },
    { label: "Open sales", value: selling.filter((o) => OPEN_ORDER_STATUSES.has(o.status)).length },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Your activity
          </h1>
        </div>
        {!isAdmin && (
          <Link
            href="/profile/bank-details"
            className={`flex items-center gap-1.5 text-sm font-medium underline underline-offset-4 ${
              hasPayoutAccount
                ? "text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                : "text-destructive"
            }`}
          >
            {hasPayoutAccount ? (
              <TbCircleCheck className="size-4 shrink-0" />
            ) : (
              <TbAlertCircle className="size-4 shrink-0" />
            )}
            {hasPayoutAccount ? "Payout details" : "Add payout details"}
          </Link>
        )}
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

      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings">My listings</TabsTrigger>
          <TabsTrigger value="buying">Buying</TabsTrigger>
          <TabsTrigger value="selling">Selling</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-3 pt-4">
          {listings.length === 0 ? (
            <EmptyState
              message="You haven't listed anything yet."
              href="/sell/new"
              cta="Create a listing"
            />
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
            <EmptyState
              message="You haven't bought anything yet."
              href="/marketplace"
              cta="Browse listings"
            />
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
            <EmptyState
              message="No sales yet."
              href="/sell/new"
              cta="Create a listing"
            />
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
      </Tabs>
    </div>
  );
}

function Thumbnail({ src, alt }: { src?: string; alt: string }) {
  return (
    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" unoptimized />
      ) : (
        <div className="flex h-full items-center justify-center">
          <TbPhoto className="size-5 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

function EmptyState({
  message,
  href,
  cta,
}: {
  message: string;
  href: string;
  cta: string;
}) {
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

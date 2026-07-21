import Link from "next/link";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

const orderStatusLabel: Record<string, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  FUNDED: "Funds in escrow",
  SHIPPED: "Shipped",
  RELEASED: "Released",
  DISPUTED: "Disputed",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [listings, buying, selling] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: "desc" },
      include: { listing: { select: { title: true } } },
    }),
    prisma.order.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      include: { listing: { select: { title: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
        <Link
          href="/profile/bank-details"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Payout details
        </Link>
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
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{listing.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNaira(listing.priceKobo)}
                      </p>
                    </div>
                    <Badge variant="secondary">{listing.status}</Badge>
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
              href="/"
              cta="Browse listings"
            />
          ) : (
            buying.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{order.listing.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNaira(order.amountKobo)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {orderStatusLabel[order.status] ?? order.status}
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
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{order.listing.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNaira(order.amountKobo)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {orderStatusLabel[order.status] ?? order.status}
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
      {message}{" "}
      <Link href={href} className="underline underline-offset-4">
        {cta}
      </Link>
      .
    </div>
  );
}

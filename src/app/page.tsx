import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function Home() {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: { seller: { select: { name: true } } },
  });

  return (
    <div>
      <section className="relative overflow-hidden bg-[linear-gradient(160deg,var(--brand-deep),var(--brand)_65%,var(--brand-bright))] px-4 py-20 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(225,239,154,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(144,234,242,0.16),transparent_50%)]"
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-start gap-6">
          <Badge className="rounded-full border-white/20 bg-white/10 text-white">
            Escrow for classifieds
          </Badge>

          <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Buy and sell without the risk.
          </h1>

          <p className="max-w-lg text-lg text-white/80">
            Trustee holds the buyer&apos;s payment until they confirm the
            item arrived — sellers only get paid once the buyer is
            satisfied.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              size="lg"
              className="bg-white text-brand-deep hover:bg-white/90"
              render={<Link href="/sell/new" />}
            >
              Sell something
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
              render={<Link href="#listings" />}
            >
              Browse listings
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/15 bg-black/20 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="size-4 text-lime" />
              Payment held in escrow
            </div>
            <div className="hidden h-4 w-px bg-white/20 sm:block" />
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="size-4 text-cyan" />
              Released only when you confirm
            </div>
          </div>
        </div>
      </section>

      <section id="listings" className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-6 font-display text-xl font-bold tracking-tight">
          Live listings
        </h2>

        {listings.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            No listings yet.{" "}
            <Link href="/sell/new" className="underline underline-offset-4">
              Be the first to sell something
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{listing.title}</CardTitle>
                      <Badge variant="secondary">{listing.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {listing.description}
                    </p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <span className="font-semibold">
                      {formatNaira(listing.priceKobo)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {listing.seller.name}
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

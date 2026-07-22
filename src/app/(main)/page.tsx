import Link from "next/link";
import Image from "next/image";
import { TbLock, TbShieldCheck, TbShieldExclamation, TbPhoto, TbArrowRight } from "react-icons/tb";

import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  EscrowFlowIcon,
  ShipFlowIcon,
  ConfirmFlowIcon,
  PayoutFlowIcon,
} from "@/components/escrow-flow-icon";

export const dynamic = "force-dynamic";

const steps: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}[] = [
  {
    icon: EscrowFlowIcon,
    title: "Buyer pays into escrow",
    description: "Payment goes to Trustee, not the seller — held safely until the item arrives.",
  },
  {
    icon: ShipFlowIcon,
    title: "Seller ships",
    description: "The seller marks the item as shipped once it's on its way.",
  },
  {
    icon: ConfirmFlowIcon,
    title: "Buyer confirms receipt",
    description: "The buyer checks the item and confirms it arrived as described.",
  },
  {
    icon: PayoutFlowIcon,
    title: "Seller gets paid",
    description: "Funds release to the seller the moment the buyer confirms — or automatically after a few days.",
  },
];

export default async function Home() {
  let recentListings = [];
  try {
    recentListings = await prisma.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { seller: { select: { name: true } } },
    });
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    // Continue with empty listings array
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-[linear-gradient(160deg,var(--brand-deep),var(--brand)_65%,var(--brand-bright))] px-4 py-14 text-white sm:px-6 sm:py-20">
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
              render={<Link href="/marketplace" />}
            >
              Browse listings
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/15 bg-black/20 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-2 text-sm">
              <TbLock className="size-4 text-lime" />
              Payment held in escrow
            </div>
            <div className="hidden h-4 w-px bg-white/20 sm:block" />
            <div className="flex items-center gap-2 text-sm">
              <TbShieldCheck className="size-4 text-cyan" />
              Released only when you confirm
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-border bg-muted/30 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="max-w-2xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            Money only moves when trust is earned.
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Four steps, one safeguard: your payment never reaches the seller until you say
            it&apos;s okay.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.title} className="bg-background p-6">
                <step.icon className="size-24" />
                <p className="mt-6 text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
                  Step {i + 1}
                </p>
                <p className="mt-1 font-display text-base font-bold">{step.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
            <div className="col-span-full flex items-start gap-2 bg-background p-6 text-sm text-muted-foreground">
              <TbShieldExclamation className="mt-0.5 size-4 shrink-0 text-brand" />
              <p>
                If something goes wrong, either side can raise a dispute — release is paused
                until a Trustee admin reviews it and decides who gets paid.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="listings" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight">
            Recently listed
          </h2>
          <Link
            href="/marketplace"
            className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            Browse the marketplace
            <TbArrowRight className="size-3.5" />
          </Link>
        </div>

        {recentListings.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            No listings yet.{" "}
            <Link href="/sell/new" className="underline underline-offset-4">
              Be the first to sell something
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {recentListings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <Card className="h-full gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
                  <div className="relative aspect-square bg-muted">
                    {listing.imageUrls[0] ? (
                      <Image
                        src={listing.imageUrls[0]}
                        alt={listing.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <TbPhoto className="size-8 text-muted-foreground/40" />
                      </div>
                    )}
                    <Badge variant="secondary" className="absolute top-2 right-2">
                      {listing.category}
                    </Badge>
                  </div>
                  <CardContent className="py-3">
                    <p className="text-lg font-bold">{formatNaira(listing.priceKobo)}</p>
                    <p className="line-clamp-1 text-sm font-medium">{listing.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {listing.seller.name}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import {
  TbLock,
  TbShieldCheck,
  TbShieldExclamation,
  TbPhoto,
  TbArrowRight,
  TbPercentage,
  TbX,
  TbCheck,
} from "react-icons/tb";

import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionPanel } from "@/components/ui/accordion";
import { ImageWithSkeleton } from "@/components/image-with-skeleton";
import { PageContainer } from "@/components/page-container";
import { CategoryIcon } from "@/lib/category-icons";
import { listingCategories } from "@/lib/validations/listing";
import { WayBadges } from "./way-badges";
import {
  EscrowFlowIcon,
  ShipFlowIcon,
  ConfirmFlowIcon,
  PayoutFlowIcon,
} from "@/components/escrow-flow-icon";

export const dynamic = "force-dynamic";

const withoutTrustee = [
  "You transfer the money first, then just hope the item shows up",
  "No record of what was actually agreed on",
  "If it goes wrong, it's your word against theirs",
];

const withTrustee = [
  "Your payment sits with Trustee, not the seller, until you confirm",
  "You check the item before the money ever moves",
  "A dispute gets a neutral second look, not a shouting match",
];

const categoryShowcase: Record<(typeof listingCategories)[number], string> = {
  Electronics: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  Fashion: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80",
  "Home & Furniture": "https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800&q=80",
  Vehicles: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&q=80",
  "Phones & Tablets": "https://images.unsplash.com/photo-1592286927505-1def25115558?w=800&q=80",
  Other: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80",
};

const faqs = [
  {
    q: "What if the item isn't what was described?",
    a: "Raise a dispute before you confirm receipt. A Trustee admin looks at both sides and decides who gets paid — your money doesn't move until that's settled.",
  },
  {
    q: "How fast does a seller actually get paid?",
    a: "The moment the buyer confirms the item arrived. If they never respond, it releases automatically after a short window, so sellers aren't left waiting indefinitely.",
  },
  {
    q: "What's the fee, and who pays it?",
    a: `Trustee takes ${Number(process.env.PLATFORM_FEE_BPS ?? "500") / 100}% of the sale, deducted from the seller's payout. Buyers pay exactly the listed price.`,
  },
  {
    q: "Do I need a bank account to sell here?",
    a: "Yes — add your payout details once from the dashboard. That's how funds reach you once a sale is confirmed.",
  },
  {
    q: "What happens if we just disagree?",
    a: "Either side can raise a dispute. It pauses the payout until an admin reviews both sides — there's no automatic default to buyer or seller.",
  },
];

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

const platformFeePercent = Number(process.env.PLATFORM_FEE_BPS ?? "500") / 100;

export default async function Home() {
  let recentListings: Array<{
    id: string;
    title: string;
    description: string;
    priceKobo: bigint;
    imageUrls: string[];
    category: string;
    status: string;
    seller: { name: string };
  }> = [];
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
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-center overflow-hidden bg-[linear-gradient(160deg,var(--brand-deep),var(--brand)_65%,var(--brand-bright))] text-white">
        {/* Ambient brand glows, kept subtle so the photo and copy stay the focus */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(225,239,154,0.14),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(144,234,242,0.12),transparent_50%)]"
        />

        {/* The handshake photo — the hero's backdrop, bled off the right edge
            on desktop; masked (not scrimmed) into the gradient so the studio
            grey blends rather than sitting as a hard-edged rectangle. */}
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 left-[30%] [mask-image:linear-gradient(to_right,transparent,rgba(0,0,0,0.35)_25%,black_65%)] sm:left-[38%] lg:left-[46%]"
        >
          <Image
            src="/hero-deal-image.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 54vw, (min-width: 640px) 62vw, 70vw"
            className="object-cover object-[75%_30%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(37,19,119,0.35),rgba(67,52,211,0.15)_60%)] mix-blend-multiply" />
        </div>

        <PageContainer className="relative flex w-full flex-col items-start gap-6 py-14 sm:py-20">
          <Badge className="rounded-full border-white/20 bg-white/10 text-white">
            Escrow for classifieds
          </Badge>

          <h1 className="animate-in fade-in slide-in-from-bottom-2 max-w-xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight duration-700 sm:text-6xl">
            Shake on it. We&apos;ll hold the money.
          </h1>

          <p className="animate-in fade-in slide-in-from-bottom-2 max-w-md text-lg text-white/80 duration-700 delay-150 fill-mode-both">
            The moment you pay, Trustee holds it in escrow. The seller only
            gets paid once you&apos;ve confirmed the item actually showed up.
          </p>

          <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-wrap gap-3 pt-2 duration-700 delay-300 fill-mode-both">
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
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              render={<Link href="/marketplace" />}
            >
              Browse listings
            </Button>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-white/15 pt-6 text-sm sm:flex-row sm:gap-8">
            <div className="flex items-center gap-2">
              <TbLock className="size-4 shrink-0 text-lime" />
              Payment held in escrow
            </div>
            <div className="flex items-center gap-2">
              <TbShieldCheck className="size-4 shrink-0 text-cyan" />
              Released only when you confirm
            </div>
            <div className="flex items-center gap-2">
              <TbPercentage className="size-4 shrink-0 text-[var(--sand)]" />
              Just a {platformFeePercent}% fee, on completed sales
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="border-t border-border py-14 sm:py-20">
        <PageContainer>
          <h2 className="max-w-xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            The handshake deal, minus the risk
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Most secondhand deals still run on bank transfers and trust. Here&apos;s the
            difference it makes when someone else holds the money in between.
          </p>

          <WayBadges />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border p-6">
              <p className="font-display text-sm font-bold text-muted-foreground">
                Sending money and hoping
              </p>
              <ul className="mt-4 space-y-3">
                {withoutTrustee.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <TbX className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-brand/30 bg-accent/40 p-6">
              <p className="font-display text-sm font-bold text-brand-deep dark:text-brand-bright">
                Paying into escrow
              </p>
              <ul className="mt-4 space-y-3">
                {withTrustee.map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-sm">
                    <TbCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </PageContainer>
      </section>

      <section id="how-it-works" className="border-t border-border bg-muted/30 py-14 sm:py-20">
        <PageContainer>
          <h2 className="max-w-2xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            Money only moves when trust is earned.
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Four steps, one safeguard: your payment never reaches the seller until you say
            it&apos;s okay.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/20 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.title} className="bg-brand-deep p-6">
                <step.icon className="size-24 text-white" />
                <p className="mt-6 text-xs font-semibold tracking-[0.15em] text-white/70 uppercase">
                  Step {i + 1}
                </p>
                <p className="mt-1 font-display text-base font-bold text-white">{step.title}</p>
                <p className="mt-2 text-sm text-white/80">{step.description}</p>
              </div>
            ))}
            <div className="col-span-full flex items-start gap-2 bg-brand-deep p-6 text-sm text-white/80">
              <TbShieldExclamation className="mt-0.5 size-4 shrink-0 text-lime" />
              <p>
                If something goes wrong, either side can raise a dispute — release is paused
                until a Trustee admin reviews it and decides who gets paid.
              </p>
            </div>
          </div>
        </PageContainer>
      </section>

      <section className="border-t border-border py-14 sm:py-20">
        <PageContainer>
          <h2 className="max-w-xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            Whatever you&apos;re after, it&apos;s probably already listed
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Six categories, one guarantee: the same escrow protects every purchase.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {listingCategories.map((category) => (
              <Link
                key={category}
                href={`/marketplace?category=${encodeURIComponent(category)}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl"
              >
                <Image
                  src={categoryShowcase[category]}
                  alt=""
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 350px, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-4 text-white">
                  <CategoryIcon category={category} active className="size-4 shrink-0" />
                  <span className="font-display text-sm font-bold">{category}</span>
                </div>
              </Link>
            ))}
          </div>
        </PageContainer>
      </section>

      <PageContainer as="section" id="listings" className="py-10 sm:py-14">
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
                      <ImageWithSkeleton src={listing.imageUrls[0]} alt={listing.title} />
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
                    <p className="font-display text-lg font-bold">{formatNaira(listing.priceKobo)}</p>
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
      </PageContainer>

      <section className="border-t border-border bg-muted/30 py-14 sm:py-20">
        <PageContainer>
          <h2 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
            Questions worth asking before you pay a stranger
          </h2>

          <Accordion className="mt-8" defaultValue={[0]}>
            {faqs.map((faq, i) => (
              <AccordionItem key={faq.q} value={i}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionPanel>{faq.a}</AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </PageContainer>
      </section>
    </div>
  );
}

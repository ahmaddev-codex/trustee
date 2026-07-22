import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { TbArrowLeft } from "react-icons/tb";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { computePlatformFeeKobo } from "@/lib/fees";
import { Badge } from "@/components/ui/badge";
import { BuyButton } from "./buy-button";

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({
  params,
}: PageProps<"/listings/[id]">) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { seller: { select: { id: true, name: true, createdAt: true } } },
  });

  if (!listing) notFound();

  const session = await auth();
  const isOwnListing = session?.user?.id === listing.sellerId;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/marketplace"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <TbArrowLeft className="size-4" />
        Back to Marketplace
      </Link>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {listing.imageUrls.map((url, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-lg border">
            <Image src={url} alt={listing.title} fill className="object-cover" unoptimized />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <Badge variant="secondary" className="mb-2">
            {listing.category}
          </Badge>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            {listing.title}
          </h1>
        </div>
        <div className="text-2xl font-bold whitespace-nowrap">
          {formatNaira(listing.priceKobo)}
        </div>
      </div>

      <p className="mt-6 whitespace-pre-wrap text-muted-foreground">
        {listing.description}
      </p>

      <div className="mt-6 flex items-center justify-between border border-border p-4 text-sm">
        <span className="font-medium">{listing.seller.name}</span>
        <span className="text-muted-foreground">
          Member since{" "}
          {listing.seller.createdAt.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="mt-6 rounded-2xl border bg-accent/40 p-5">
        {listing.status !== "ACTIVE" ? (
          <p className="text-sm text-muted-foreground">
            This listing is no longer available.
          </p>
        ) : isOwnListing ? (
          <p className="text-sm text-muted-foreground">
            This is your own listing.
          </p>
        ) : (
          <BuyButton
            listingId={listing.id}
            isAuthed={!!session?.user}
            itemPriceLabel={formatNaira(listing.priceKobo)}
            platformFeeLabel={formatNaira(computePlatformFeeKobo(listing.priceKobo))}
          />
        )}
      </div>
    </div>
  );
}

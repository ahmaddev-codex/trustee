import { notFound } from "next/navigation";
import Image from "next/image";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatNaira } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { BuyButton } from "./buy-button";

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({
  params,
}: PageProps<"/listings/[id]">) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { seller: { select: { id: true, name: true } } },
  });

  if (!listing) notFound();

  const session = await auth();
  const isOwnListing = session?.user?.id === listing.sellerId;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
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
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {listing.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sold by {listing.seller.name}
          </p>
        </div>
        <div className="text-2xl font-bold whitespace-nowrap">
          {formatNaira(listing.priceKobo)}
        </div>
      </div>

      <p className="mt-6 whitespace-pre-wrap text-muted-foreground">
        {listing.description}
      </p>

      <div className="mt-8 rounded-2xl border bg-accent/40 p-5">
        {listing.status !== "ACTIVE" ? (
          <p className="text-sm text-muted-foreground">
            This listing is no longer available.
          </p>
        ) : isOwnListing ? (
          <p className="text-sm text-muted-foreground">
            This is your own listing.
          </p>
        ) : (
          <BuyButton listingId={listing.id} isAuthed={!!session?.user} />
        )}
      </div>
    </div>
  );
}

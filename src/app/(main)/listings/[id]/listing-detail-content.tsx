import { TbShieldCheck, TbUser } from "react-icons/tb";

import { formatNaira } from "@/lib/money";
import { computePlatformFeeKobo } from "@/lib/fees";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BuyButton } from "./buy-button";
import { AddToCartButton } from "./add-to-cart-button";
import { ManageListingActions } from "./manage-listing-actions";
import { ListingGallery } from "./listing-gallery";

export interface ListingDetailData {
  id: string;
  title: string;
  description: string;
  priceKobo: bigint;
  imageUrls: string[];
  category: string;
  status: "ACTIVE" | "SOLD" | "REMOVED";
  seller: { name: string; image: string | null; createdAt: Date };
}

// Shared by the real /listings/[id] page and its intercepted modal route.
// Excludes outer page chrome (wrapper, back link) - callers own that.
export function ListingDetailContent({
  listing,
  isAuthed,
  isOwnListing,
}: {
  listing: ListingDetailData;
  isAuthed: boolean;
  isOwnListing: boolean;
}) {
  return (
    <div>
      <ListingGallery imageUrls={listing.imageUrls} title={listing.title} />

      <div className="mt-6 flex items-start justify-between gap-4">
        <div>
          <Badge variant="secondary" className="mb-2">
            {listing.category}
          </Badge>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            {listing.title}
          </h1>
        </div>
        <div className="text-right">
          {listing.status === "ACTIVE" && !isOwnListing && (
            <Badge variant="secondary" className="mb-2 gap-1.5 bg-accent text-accent-foreground">
              <TbShieldCheck className="size-3.5" />
              Pay into escrow
            </Badge>
          )}
          <div className="font-display text-2xl font-bold whitespace-nowrap">
            {formatNaira(listing.priceKobo)}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="font-display font-bold">Product Description</h2>
        <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{listing.description}</p>
      </div>

      {isOwnListing && (listing.status === "ACTIVE" || listing.status === "REMOVED") ? (
        <div className="mt-6">
          <ManageListingActions listingId={listing.id} status={listing.status} />
        </div>
      ) : listing.status !== "ACTIVE" ? (
        <p className="mt-6 text-sm text-muted-foreground">This listing is no longer available.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {!isAuthed && (
            <p className="text-sm text-muted-foreground">Log in to buy this item.</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <BuyButton
              listingId={listing.id}
              isAuthed={isAuthed}
              itemPriceLabel={formatNaira(listing.priceKobo)}
              platformFeeLabel={formatNaira(computePlatformFeeKobo(listing.priceKobo))}
            />
            <AddToCartButton listingId={listing.id} isAuthed={isAuthed} />
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border p-4">
        <Avatar size="lg">
          {listing.seller.image && (
            <AvatarImage src={listing.seller.image} alt={listing.seller.name} />
          )}
          <AvatarFallback className="bg-accent text-accent-foreground">
            <TbUser className="size-1/2" />
          </AvatarFallback>
        </Avatar>
        <div className="text-sm">
          <p className="font-medium">{listing.seller.name}</p>
          <p className="text-muted-foreground">
            Member since{" "}
            {listing.seller.createdAt.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

import { formatNaira } from "@/lib/money";
import { computePlatformFeeKobo } from "@/lib/fees";
import { Badge } from "@/components/ui/badge";
import { BuyButton } from "./buy-button";
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
  seller: { name: string; createdAt: Date };
}

// Shared by the real /listings/[id] page and its intercepted modal route.
// Excludes outer page chrome (wrapper, back link) — callers own that.
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
        <div className="text-2xl font-bold whitespace-nowrap">
          {formatNaira(listing.priceKobo)}
        </div>
      </div>

      <p className="mt-6 whitespace-pre-wrap text-muted-foreground">{listing.description}</p>

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
        {isOwnListing && (listing.status === "ACTIVE" || listing.status === "REMOVED") ? (
          <ManageListingActions listingId={listing.id} status={listing.status} />
        ) : listing.status !== "ACTIVE" ? (
          <p className="text-sm text-muted-foreground">This listing is no longer available.</p>
        ) : (
          <BuyButton
            listingId={listing.id}
            isAuthed={isAuthed}
            itemPriceLabel={formatNaira(listing.priceKobo)}
            platformFeeLabel={formatNaira(computePlatformFeeKobo(listing.priceKobo))}
          />
        )}
      </div>
    </div>
  );
}

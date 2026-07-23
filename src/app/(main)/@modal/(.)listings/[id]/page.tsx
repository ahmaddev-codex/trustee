import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListingModal } from "@/components/listing-modal";
import { ListingDetailContent } from "@/app/(main)/listings/[id]/listing-detail-content";

export const dynamic = "force-dynamic";

export default async function InterceptedListingModal({
  params,
}: PageProps<"/listings/[id]">) {
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { seller: { select: { id: true, name: true, createdAt: true } } },
  });

  const session = await auth();

  return (
    <ListingModal>
      {listing ? (
        <ListingDetailContent
          listing={listing}
          isAuthed={!!session?.user}
          isOwnListing={session?.user?.id === listing.sellerId}
        />
      ) : (
        <p className="text-sm text-muted-foreground">This listing is no longer available.</p>
      )}
    </ListingModal>
  );
}

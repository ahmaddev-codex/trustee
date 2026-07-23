import { notFound } from "next/navigation";
import Link from "next/link";
import { TbArrowLeft } from "react-icons/tb";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ListingDetailContent } from "./listing-detail-content";

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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <Link
        href="/marketplace"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <TbArrowLeft className="size-4" />
        Back to Marketplace
      </Link>

      <ListingDetailContent
        listing={listing}
        isAuthed={!!session?.user}
        isOwnListing={isOwnListing}
      />
    </div>
  );
}

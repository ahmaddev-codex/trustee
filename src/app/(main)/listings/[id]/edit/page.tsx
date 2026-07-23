import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TbArrowLeft } from "react-icons/tb";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { koboToNairaAmount } from "@/lib/money";
import { EditListingForm } from "./edit-listing-form";

export const dynamic = "force-dynamic";

export default async function EditListingPage({ params }: PageProps<"/listings/[id]/edit">) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) redirect(`/login?callbackUrl=/listings/${id}/edit`);

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) notFound();
  if (listing.sellerId !== session.user.id) notFound();
  // A listing with a sale in progress can't be edited out from under the buyer.
  if (listing.status === "SOLD") redirect(`/listings/${id}`);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <Link
        href={`/listings/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <TbArrowLeft className="size-4" />
        Back to listing
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Edit listing
        </h1>
      </div>

      <EditListingForm
        listing={{
          id: listing.id,
          title: listing.title,
          description: listing.description,
          priceNaira: koboToNairaAmount(listing.priceKobo),
          category: listing.category,
          imageUrls: listing.imageUrls,
        }}
      />
    </div>
  );
}

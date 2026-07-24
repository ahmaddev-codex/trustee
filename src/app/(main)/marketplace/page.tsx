import Link from "next/link";
import { TbShoppingBagSearch, TbPhoto, TbPlus } from "react-icons/tb";

import { prisma } from "@/lib/prisma";
import { formatNaira, nairaToKobo } from "@/lib/money";
import { listingCategories } from "@/lib/validations/listing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageWithSkeleton } from "@/components/image-with-skeleton";
import { CategoryIcon } from "@/lib/category-icons";
import { MarketplaceFilters } from "./marketplace-filters";
import { PageContainer } from "@/components/page-container";

export const dynamic = "force-dynamic";

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

function buildHref(params: {
  category?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}) {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.q) search.set("q", params.q);
  if (params.minPrice) search.set("minPrice", params.minPrice);
  if (params.maxPrice) search.set("maxPrice", params.maxPrice);
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  const qs = search.toString();
  return qs ? `/marketplace?${qs}` : "/marketplace";
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const asString = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

  const rawCategory = asString(params.category);
  const activeCategory =
    rawCategory && listingCategories.includes(rawCategory as (typeof listingCategories)[number])
      ? rawCategory
      : undefined;
  const q = (asString(params.q) ?? "").trim();
  const minPriceNaira = asString(params.minPrice);
  const maxPriceNaira = asString(params.maxPrice);
  const sort: SortValue = sortOptions.some((o) => o.value === params.sort)
    ? (params.sort as SortValue)
    : "newest";

  const minPrice = minPriceNaira ? Number(minPriceNaira) : undefined;
  const maxPrice = maxPriceNaira ? Number(maxPriceNaira) : undefined;

  let listings: Array<{
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
    listings = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        ...(activeCategory ? { category: activeCategory } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { category: { contains: q, mode: "insensitive" } },
                { seller: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
        ...(minPrice !== undefined && !Number.isNaN(minPrice)
          ? { priceKobo: { gte: nairaToKobo(minPrice) } }
          : {}),
        ...(maxPrice !== undefined && !Number.isNaN(maxPrice)
          ? { priceKobo: { lte: nairaToKobo(maxPrice) } }
          : {}),
      },
      orderBy:
        sort === "price_asc"
          ? { priceKobo: "asc" }
          : sort === "price_desc"
            ? { priceKobo: "desc" }
            : { createdAt: "desc" },
      include: { seller: { select: { name: true } } },
    });
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    // Continue with empty listings array
  }

  const hasFilters = Boolean(q || activeCategory || minPriceNaira || maxPriceNaira);

  return (
    <PageContainer className="py-6 sm:py-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Browse listings
        </h1>
        <Button render={<Link href="/sell/new" />}>
          <TbPlus data-icon="inline-start" className="size-4" />
          List an item
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <MarketplaceFilters
            // Remounts fresh whenever the URL's filters change instead of
            // reusing the same instance — that's what keeps the uncontrolled
            // search/price inputs and the sort select from going stale (e.g.
            // still showing old values right after "Clear all filters").
            key={`${q}|${minPriceNaira ?? ""}|${maxPriceNaira ?? ""}|${sort}|${activeCategory ?? ""}`}
            q={q}
            minPrice={minPriceNaira}
            maxPrice={maxPriceNaira}
            sort={sort}
            category={activeCategory}
            hasFilters={hasFilters}
          />

          <div>
            <p className="mb-3 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              Categories
            </p>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link
                  href={buildHref({ q, minPrice: minPriceNaira, maxPrice: maxPriceNaira, sort })}
                  className={`block rounded-full px-4 py-2 ${
                    !activeCategory
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  All categories
                </Link>
              </li>
              {listingCategories.map((c) => (
                <li key={c}>
                  <Link
                    href={buildHref({
                      category: c,
                      q,
                      minPrice: minPriceNaira,
                      maxPrice: maxPriceNaira,
                      sort,
                    })}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                      activeCategory === c
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <CategoryIcon category={c} active={activeCategory === c} className="size-4" />
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            {listings.length} {listings.length === 1 ? "listing" : "listings"}
          </p>

          {listings.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              <TbShoppingBagSearch className="mx-auto mb-3 size-8 text-muted-foreground/60" />
              {hasFilters ? (
                <>
                  No active listings match your filters.{" "}
                  <Link href="/marketplace" className="underline underline-offset-4">
                    Clear filters
                  </Link>
                  .
                </>
              ) : (
                <>
                  No listings yet.{" "}
                  <Link href="/sell/new" className="underline underline-offset-4">
                    Be the first to sell something
                  </Link>
                  .
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {listings.map((listing) => (
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
        </div>
      </div>
    </PageContainer>
  );
}

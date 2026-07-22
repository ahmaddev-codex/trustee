"use client";

import { useRouter } from "next/navigation";
import { TbSearch } from "react-icons/tb";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function MarketplaceFilters({
  q,
  minPrice,
  maxPrice,
  sort,
  category,
  hasFilters,
}: {
  q: string;
  minPrice?: string;
  maxPrice?: string;
  sort: string;
  category?: string;
  hasFilters: boolean;
}) {
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const key of ["q", "minPrice", "maxPrice", "sort", "category"]) {
      const value = formData.get(key);
      if (typeof value === "string" && value && !(key === "sort" && value === "newest")) {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    router.push(qs ? `/marketplace?${qs}` : "/marketplace");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="relative">
        <TbSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search listings…"
          className="pl-9"
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Price range (₦)
        </p>
        <div className="flex items-center gap-2">
          <Input type="number" name="minPrice" min={0} defaultValue={minPrice} placeholder="Min" />
          <span className="text-muted-foreground">–</span>
          <Input type="number" name="maxPrice" min={0} defaultValue={maxPrice} placeholder="Max" />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Sort by
        </p>
        <select name="sort" defaultValue={sort} className={selectClass}>
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {category && <input type="hidden" name="category" value={category} />}

      <Button type="submit" size="sm" className="w-full">
        Apply filters
      </Button>
      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push("/marketplace")}
          className="block w-full text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Clear all filters
        </button>
      )}
    </form>
  );
}

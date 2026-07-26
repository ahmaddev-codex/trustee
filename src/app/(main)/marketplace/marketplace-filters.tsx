"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TbSearch } from "react-icons/tb";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

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
  // Controlled so the trigger's label always matches the current sort - the
  // component remounts on filter changes, so this starts fresh, not stale.
  const [sortValue, setSortValue] = useState(sort);

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
        <input type="hidden" name="sort" value={sortValue} />
        <Select value={sortValue} onValueChange={(value) => setSortValue(value ?? "newest")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {category && <input type="hidden" name="category" value={category} />}

      <Button type="submit" size="sm" className="w-full">
        Apply filters
      </Button>
      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => router.push("/marketplace")}
        >
          Clear all filters
        </Button>
      )}
    </form>
  );
}

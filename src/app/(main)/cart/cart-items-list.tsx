"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TbTrash } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageWithSkeleton } from "@/components/image-with-skeleton";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { formatNaira } from "@/lib/money";
import type { CartResponse } from "@/lib/cart-types";

export function CartItemsList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const initialized = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.cart.all(),
    queryFn: () => apiFetch<CartResponse>("/api/cart"),
  });

  const items = data?.items ?? [];

  // Default every item to checked the first time the cart loads.
  useEffect(() => {
    if (!initialized.current && data) {
      setSelected(new Set(data.items.map((item) => item.listing.id)));
      initialized.current = true;
    }
  }, [data]);

  const remove = useMutation({
    mutationFn: (listingId: string) => apiFetch(`/api/cart/${listingId}`, { method: "DELETE" }),
    onSuccess: (_data, listingId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all() });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not remove item");
    },
  });

  const checkout = useMutation({
    mutationFn: (listingIds: string[]) =>
      apiFetch<{ checkoutUrl: string }>("/api/cart/checkout", {
        method: "POST",
        body: JSON.stringify({ listingIds }),
      }),
    onSuccess: (data) => {
      router.push(`/checkout-redirect?url=${encodeURIComponent(data.checkoutUrl)}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not start checkout");
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all() });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-2xl border bg-muted skeleton-shimmer" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border p-8 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button className="mt-4" render={<Link href="/marketplace" />}>
          Browse listings
        </Button>
      </div>
    );
  }

  const allSelected = selected.size === items.length;
  const someSelected = selected.size > 0 && !allSelected;
  const subtotalKobo = items
    .filter((item) => selected.has(item.listing.id))
    .reduce((sum, item) => sum + BigInt(item.listing.priceKobo), 0n);

  function toggle(listingId: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(listingId);
      else next.delete(listingId);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(items.map((item) => item.listing.id)) : new Set());
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 px-1">
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onCheckedChange={(checked) => toggleAll(checked)}
        />
        <span className="text-sm text-muted-foreground">Select all</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const unavailable = item.listing.status !== "ACTIVE";
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-2xl border p-3"
            >
              <Checkbox
                checked={selected.has(item.listing.id)}
                disabled={unavailable}
                onCheckedChange={(checked) => toggle(item.listing.id, checked)}
              />
              <Link
                href={`/listings/${item.listing.id}`}
                className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted"
              >
                <ImageWithSkeleton
                  src={item.listing.imageUrls[0]}
                  alt={item.listing.title}
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/listings/${item.listing.id}`}
                  className="block truncate font-medium hover:underline"
                >
                  {item.listing.title}
                </Link>
                <p className="text-sm text-muted-foreground">{item.listing.seller.name}</p>
                {unavailable && (
                  <p className="text-xs font-medium text-destructive">No longer available</p>
                )}
              </div>
              <div className="font-display text-right font-medium whitespace-nowrap">
                {formatNaira(BigInt(item.listing.priceKobo))}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={remove.isPending}
                onClick={() => remove.mutate(item.listing.id)}
              >
                <TbTrash className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border bg-accent/40 p-5">
        <div>
          <p className="text-sm text-muted-foreground">Subtotal ({selected.size} selected)</p>
          <p className="font-display text-xl font-bold">{formatNaira(subtotalKobo)}</p>
        </div>
        <Button
          disabled={selected.size === 0 || checkout.isPending}
          onClick={() => checkout.mutate([...selected])}
        >
          {checkout.isPending ? "Starting checkout…" : "Checkout"}
        </Button>
      </div>
    </div>
  );
}

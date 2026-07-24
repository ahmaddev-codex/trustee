"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TbShoppingCartPlus, TbShoppingCartCheck } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { CartResponse } from "@/lib/cart-types";

export function AddToCartButton({
  listingId,
  isAuthed,
}: {
  listingId: string;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: queryKeys.cart.all(),
    queryFn: () => apiFetch<CartResponse>("/api/cart"),
    enabled: isAuthed,
  });

  const inCart = data?.items.some((item) => item.listing.id === listingId) ?? false;

  const addToCart = useMutation({
    mutationFn: () => apiFetch("/api/cart", { method: "POST", body: JSON.stringify({ listingId }) }),
    onSuccess: () => {
      toast.success("Added to cart");
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all() });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not add to cart");
    },
  });

  if (!isAuthed) {
    return (
      <Button variant="outline" onClick={() => router.push(`/login?callbackUrl=/listings/${listingId}`)}>
        <TbShoppingCartPlus className="size-4" />
        Add to cart
      </Button>
    );
  }

  if (inCart) {
    return (
      <Button variant="outline" render={<Link href="/cart" />}>
        <TbShoppingCartCheck className="size-4" />
        In cart
      </Button>
    );
  }

  return (
    <Button variant="outline" disabled={addToCart.isPending} onClick={() => addToCart.mutate()}>
      <TbShoppingCartPlus className="size-4" />
      {addToCart.isPending ? "Adding…" : "Add to cart"}
    </Button>
  );
}

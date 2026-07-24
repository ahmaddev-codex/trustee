"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { TbShoppingCart } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { CartResponse } from "@/lib/cart-types";

export function CartButton() {
  const { status } = useSession();

  const { data } = useQuery({
    queryKey: queryKeys.cart.all(),
    queryFn: () => apiFetch<CartResponse>("/api/cart"),
    enabled: status === "authenticated",
    refetchInterval: 30_000,
  });

  if (status !== "authenticated") return null;

  const count = data?.items.length ?? 0;

  return (
    <Button variant="ghost" size="icon-sm" className="relative" render={<Link href="/cart" />}>
      <TbShoppingCart className="size-4" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Button>
  );
}

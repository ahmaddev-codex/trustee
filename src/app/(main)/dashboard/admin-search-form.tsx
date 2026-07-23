"use client";

import { useRouter } from "next/navigation";
import { TbSearch } from "react-icons/tb";

import { Input } from "@/components/ui/input";

export function AdminSearchForm({ q }: { q: string }) {
  const router = useRouter();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const value = String(formData.get("q") ?? "").trim();
    router.push(value ? `/dashboard?q=${encodeURIComponent(value)}` : "/dashboard");
  };

  return (
    <form onSubmit={onSubmit} className="relative max-w-md">
      <TbSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Look up a user, listing, or order…"
        className="pl-9"
      />
    </form>
  );
}

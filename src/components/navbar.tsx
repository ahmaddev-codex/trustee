"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { TbArrowRight, TbMenu2, TbX, TbSearch, TbChevronDown } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notification-bell";
import { listingCategories } from "@/lib/validations/listing";

const linkClass = "text-muted-foreground hover:text-foreground";

export function Navbar() {
  const { status } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  const goToMarketplace = (params: Record<string, string>) => {
    setMobileOpen(false);
    const qs = new URLSearchParams(params).toString();
    router.push(qs ? `/marketplace?${qs}` : "/marketplace");
  };

  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = search.trim();
    goToMarketplace(q ? { q } : {});
  };

  const searchBox = (
    <form onSubmit={submitSearch} className="relative">
      <TbSearch className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search listings…"
        className="h-8 pl-8 text-sm"
      />
    </form>
  );

  // "Marketplace" is the browse-everything link; the chevron is a secondary,
  // optional shortcut into a single category — kept as one visual unit so it
  // doesn't compete with "Marketplace" as if they were two separate places to go.
  const marketplaceNav = (
    <div className="flex items-center">
      <Link href="/marketplace" className={linkClass} onClick={() => setMobileOpen(false)}>
        Marketplace
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label="Browse a category"
              className={`flex items-center pl-1 ${linkClass}`}
            />
          }
        >
          <TbChevronDown className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {listingCategories.map((c) => (
            <DropdownMenuItem key={c} onClick={() => goToMarketplace({ category: c })}>
              {c}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const browseLinks = (
    <>
      {status === "authenticated" && (
        <Link href="/dashboard" className={linkClass} onClick={() => setMobileOpen(false)}>
          Dashboard
        </Link>
      )}
    </>
  );

  const authActions =
    status === "authenticated" ? (
      <>
        <NotificationBell />
        <Button variant="outline" size="sm" onClick={() => signOut()}>
          Sign out
        </Button>
      </>
    ) : status === "loading" ? null : (
      <>
        <Link href="/login" className={linkClass} onClick={() => setMobileOpen(false)}>
          Log in
        </Link>
        <Button size="sm" render={<Link href="/signup" />}>
          Sign up now
          <TbArrowRight data-icon="inline-end" className="size-3.5" />
        </Button>
      </>
    );

  return (
    <header className="border-b">
      <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-brand-deep dark:text-brand-bright"
        >
          <span className="size-2 rounded-full bg-lime" aria-hidden />
          Trustee
        </Link>

        <div className="hidden items-center justify-center gap-6 md:flex">
          <nav className="flex items-center gap-6 text-sm">
            {marketplaceNav}
            {browseLinks}
          </nav>
          <div className="w-48 lg:w-64">{searchBox}</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
            {status === "authenticated" && (
              <Button size="sm" variant="outline" render={<Link href="/sell/new" />}>
                Sell
              </Button>
            )}
            {authActions}
          </div>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg text-foreground md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <TbX className="size-5" /> : <TbMenu2 className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t px-4 py-4 md:hidden">
          <div className="mb-4">{searchBox}</div>
          <nav className="flex flex-col gap-4 text-sm">
            <Link href="/marketplace" className={linkClass} onClick={() => setMobileOpen(false)}>
              Marketplace
            </Link>
            <div className="-mt-1 flex flex-wrap gap-2 pl-3">
              {listingCategories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                  onClick={() => goToMarketplace({ category: c })}
                >
                  {c}
                </button>
              ))}
            </div>
            {status === "authenticated" && (
              <Link href="/sell/new" className={linkClass} onClick={() => setMobileOpen(false)}>
                Sell
              </Link>
            )}
            {browseLinks}
          </nav>
          <div className="mt-4 flex items-center gap-3 border-t pt-4">{authActions}</div>
        </div>
      )}
    </header>
  );
}

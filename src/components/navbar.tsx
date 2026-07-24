"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { TbMenu2, TbX, TbSearch, TbLayoutDashboardFilled, TbUser } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notification-bell";
import { CartButton } from "@/components/cart-button";
import { PageContainer } from "@/components/page-container";
import { BrandLoader } from "@/components/brand-loader";
import { listingCategories } from "@/lib/validations/listing";
import { CategoryIcon } from "@/lib/category-icons";

const linkClass = "text-muted-foreground hover:text-foreground";

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [signingOut, setSigningOut] = useState(false);

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

  // One purple pill holds both "Marketplace" (white, underlined on hover so
  // it clearly reads as a link) and the search box (white background) right
  // beside it, so browse + search feel like a single unit.
  const marketplaceAndSearch = (
    <div className="flex items-center gap-1.5 rounded-full bg-brand-deep p-2">
      <Link
        href="/marketplace"
        className="rounded-full px-5 py-2 text-sm font-semibold text-white underline-offset-2 transition-colors hover:bg-white/15 hover:underline"
        onClick={() => setMobileOpen(false)}
      >
        Marketplace
      </Link>
      <form onSubmit={submitSearch} className="relative">
        <TbSearch className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings…"
          className="h-9 w-40 rounded-full border-none bg-white pl-8 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-white/60 lg:w-56"
        />
      </form>
    </div>
  );

  const authActions =
    status === "authenticated" ? (
      <>
        <CartButton />
        <NotificationBell />
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            setSigningOut(true);
            signOut({ callbackUrl: "/marketplace" });
          }}
        >
          Sign out
        </Button>
        <Avatar>
          {session?.user?.image && (
            <AvatarImage src={session.user.image} alt={session.user.name ?? ""} />
          )}
          <AvatarFallback className="bg-accent text-accent-foreground">
            <TbUser className="size-1/2" />
          </AvatarFallback>
        </Avatar>
      </>
    ) : status === "loading" ? null : (
      <>
        <Link href="/login" className={`text-sm ${linkClass}`} onClick={() => setMobileOpen(false)}>
          Log in
        </Link>
        <Button size="sm" render={<Link href="/signup" />}>
          Get started
        </Button>
      </>
    );

  if (signingOut) {
    return (
      <div className="fixed inset-0 z-[100]">
        <BrandLoader message="Signing you out…" />
      </div>
    );
  }

  return (
    <header className="border-b">
      <PageContainer className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3">
        {status === "authenticated" ? (
          <Button
            size="sm"
            className="gap-1.5 bg-lime text-brand-deep transition-[background-position,color] duration-500 [background-image:linear-gradient(90deg,var(--brand-deep)_50%,transparent_50%)] [background-position:100%_0] [background-size:200%_100%] hover:bg-lime hover:text-white hover:[background-position:0%_0]"
            render={<Link href="/dashboard" />}
          >
            <TbLayoutDashboardFilled
              data-icon="inline-start"
              className="size-4 text-brand-deep transition-colors duration-500 group-hover/button:text-white"
            />
            Dashboard
          </Button>
        ) : (
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-brand-deep dark:text-brand-bright"
          >
            <span className="size-2.5 rounded-full bg-lime" aria-hidden />
            Trustee
          </Link>
        )}

        <div className="hidden items-center justify-center md:flex">{marketplaceAndSearch}</div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
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
      </PageContainer>

      {mobileOpen && (
        <div className="border-t px-4 py-4 md:hidden">
          <div className="mb-4">{searchBox}</div>
          <nav className="flex flex-col gap-4 text-sm">
            <Link
              href="/marketplace"
              className="w-fit rounded-full bg-lime px-3 py-1 font-medium text-brand-deep hover:bg-lime/90"
              onClick={() => setMobileOpen(false)}
            >
              Marketplace
            </Link>
            <div className="-mt-1 flex flex-wrap gap-2 pl-3">
              {listingCategories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                  onClick={() => goToMarketplace({ category: c })}
                >
                  <CategoryIcon category={c} className="size-3.5" />
                  {c}
                </button>
              ))}
            </div>
          </nav>
          <div className="mt-4 flex items-center gap-3 border-t pt-4">{authActions}</div>
        </div>
      )}
    </header>
  );
}

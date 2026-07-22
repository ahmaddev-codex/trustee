"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { TbArrowRight, TbMenu2, TbX } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";

const linkClass = "text-muted-foreground hover:text-foreground";

export function Navbar() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const centerLinks = (
    <>
      <Link href="/marketplace" className={linkClass} onClick={() => setMobileOpen(false)}>
        Marketplace
      </Link>
      <Link href="/#how-it-works" className={linkClass} onClick={() => setMobileOpen(false)}>
        How it works
      </Link>
      {status === "authenticated" && (
        <>
          <Link href="/sell/new" className={linkClass} onClick={() => setMobileOpen(false)}>
            Sell
          </Link>
          <Link href="/dashboard" className={linkClass} onClick={() => setMobileOpen(false)}>
            Dashboard
          </Link>
          {session.user.role === "ADMIN" && (
            <Link href="/admin" className={linkClass} onClick={() => setMobileOpen(false)}>
              Admin
            </Link>
          )}
        </>
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
      <div className="mx-auto grid max-w-5xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-brand-deep dark:text-brand-bright"
        >
          <span className="size-2 rounded-full bg-lime" aria-hidden />
          Trustee
        </Link>

        <nav className="hidden items-center justify-center gap-6 text-sm md:flex">
          {centerLinks}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">{authActions}</div>
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
          <nav className="flex flex-col gap-4 text-sm">{centerLinks}</nav>
          <div className="mt-4 flex items-center gap-3 border-t pt-4">{authActions}</div>
        </div>
      )}
    </header>
  );
}

"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-brand-deep dark:text-brand-bright"
        >
          <span className="size-2 rounded-full bg-lime" aria-hidden />
          Trustee
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Browse
          </Link>

          {status === "authenticated" ? (
            <>
              <Link
                href="/sell/new"
                className="text-muted-foreground hover:text-foreground"
              >
                Sell
              </Link>
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
              {session.user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Admin
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                Sign out
              </Button>
            </>
          ) : status === "loading" ? null : (
            <>
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Log in
              </Link>
              <Button size="sm" render={<Link href="/signup" />}>
                Sign up
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

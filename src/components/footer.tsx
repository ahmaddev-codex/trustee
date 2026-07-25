import Image from "next/image";
import Link from "next/link";

import { listingCategories } from "@/lib/validations/listing";
import { CategoryIcon } from "@/lib/category-icons";
import { PageContainer } from "@/components/page-container";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-[var(--brand-deep)] text-white/70">
      <PageContainer className="grid grid-cols-1 gap-8 py-12 text-sm sm:grid-cols-3">
        <div>
          <Link href="/">
            <Image src="/trustee-logo-full-dark.svg" alt="Trustee" width={118} height={24} />
          </Link>
          <p className="mt-3 max-w-xs text-white/60">
            Escrow for P2P classifieds — payments are held until the buyer confirms receipt, so
            no one has to trust a stranger with money upfront.
          </p>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold tracking-[0.15em] text-white/40 uppercase">
            Explore
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/marketplace" className="hover:text-white">
                Browse listings
              </Link>
            </li>
            <li>
              <Link href="/#how-it-works" className="hover:text-white">
                How it works
              </Link>
            </li>
            <li>
              <Link href="/sell/new" className="hover:text-white">
                Sell something
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold tracking-[0.15em] text-white/40 uppercase">
            Categories
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            {listingCategories.map((c) => (
              <li key={c}>
                <Link
                  href={`/marketplace?category=${encodeURIComponent(c)}`}
                  className="flex items-center gap-1.5 hover:text-white"
                >
                  <CategoryIcon category={c} className="size-4" />
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </PageContainer>

      <div className="border-t border-white/10">
        <PageContainer className="flex flex-col items-center justify-between gap-3 py-4 text-xs text-white/50 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Trustee. Escrow for classifieds.</p>

          <Link
            href="https://apiconf.net"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Image
              src="/apiconf26.png"
              alt="APIConf Lagos 2026"
              width={120}
              height={49}
              className="h-6 w-auto"
            />
          </Link>
        </PageContainer>
      </div>
    </footer>
  );
}

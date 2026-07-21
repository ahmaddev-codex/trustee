import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-[var(--brand-deep)] text-white/70">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm sm:flex-row">
        <p>&copy; {new Date().getFullYear()} Trustee. Escrow for classifieds.</p>

        <Link
          href="https://apiconf.net"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <span>Built during</span>
          <Image
            src="/apiconf26.png"
            alt="APIConf Lagos 2026"
            width={120}
            height={49}
            className="h-6 w-auto"
          />
        </Link>
      </div>
    </footer>
  );
}

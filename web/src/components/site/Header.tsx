import Link from "next/link";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="Lustre home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-sage md:flex">
          <a href="/#how" className="transition-colors hover:text-ink">How it works</a>
          <a href="/#why" className="transition-colors hover:text-ink">Why Lustre</a>
          <a href="/#pricing" className="transition-colors hover:text-ink">Pricing</a>
          <a href="/#membership" className="transition-colors hover:text-ink">Membership</a>
        </nav>
        <Link
          href="/book"
          className="rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-ivory shadow-sm transition-colors hover:bg-emerald"
        >
          Book a clean
        </Link>
      </div>
    </header>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/Logo";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: "Book a clean — Lustre",
  description: "Get an instant all-in price and meet your matched pro in under a minute.",
};

export default function BookPage() {
  return (
    <>
      <header className="border-b border-line bg-ivory">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" aria-label="Lustre home">
            <Logo />
          </Link>
          <Link href="/#how" className="text-sm text-sage transition-colors hover:text-ink">
            How it works
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <div className="border-b border-line bg-cream">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <h1 className="font-display text-3xl text-ink md:text-4xl">Book your clean</h1>
            <p className="mt-2 text-sage">
              Transparent pricing, a vetted pro matched to your home, guaranteed.
            </p>
          </div>
        </div>
        <BookingFlow />
      </main>
    </>
  );
}

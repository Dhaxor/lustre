import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-sage">
              Premium home cleaning with one vetted pro who returns every visit.
              Transparent pricing, fairly-paid cleaners, guaranteed results.
            </p>
          </div>
          <FooterCol
            title="Company"
            links={[
              ["How it works", "/#how"],
              ["Why Lustre", "/#why"],
              ["Pricing", "/#pricing"],
              ["Membership", "/#membership"],
            ]}
          />
          <FooterCol
            title="For cleaners"
            links={[
              ["Become a pro", "/#cleaners"],
              ["How pay works", "/#cleaners"],
              ["Connect your software", "/#cleaners"],
            ]}
          />
          <FooterCol
            title="Trust"
            links={[
              ["Satisfaction guarantee", "/#guarantee"],
              ["Vetting & insurance", "/#why"],
              ["Book a clean", "/book"],
            ]}
          />
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 text-xs text-sage md:flex-row md:items-center">
          <p>© {2026} Lustre, Inc. Cleaners are vetted, trained, insured & bonded.</p>
          <p className="text-sage/80">All-in pricing. No surprise fees. Ever.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm text-sage">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="transition-colors hover:text-ink">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

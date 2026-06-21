import Link from "next/link";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { LustreMark } from "@/components/site/Logo";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <TrustBar />
        <HowItWorks />
        <WhyLustre />
        <Pricing />
        <Membership />
        <Cleaners />
        <Guarantee />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

/* ---------------------------------------------------------------- Hero */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 right-0 h-[36rem] w-[36rem] rounded-full bg-champagne/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 top-40 h-[28rem] w-[28rem] rounded-full bg-emerald/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-[1.05fr_0.95fr] md:py-28">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ivory px-3.5 py-1.5 text-xs font-medium text-sage">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
            Now serving premium homes & short-term rentals
          </span>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] text-ink md:text-6xl">
            Your cleaner.
            <br />
            <span className="italic text-emerald">Guaranteed.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-sage">
            One vetted, trained pro who returns every visit. All-in pricing with
            zero surprise fees. And if it&apos;s not perfect, we re-clean it free.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/book"
              className="rounded-full bg-forest px-7 py-3.5 text-sm font-medium text-ivory shadow-sm transition-colors hover:bg-emerald"
            >
              Book a clean in 60 seconds
            </Link>
            <a
              href="#pricing"
              className="rounded-full border border-line px-7 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-cream"
            >
              See transparent pricing
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-sage">
            <Chip>Vetted, trained & insured to $2M</Chip>
            <Chip>Same pro every visit</Chip>
            <Chip>24-hour re-clean guarantee</Chip>
          </div>
        </div>

        <ProPreviewCard />
      </div>
    </section>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg viewBox="0 0 20 20" className="h-4 w-4 text-gold" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.1 3.1 6.8-6.8a1 1 0 0 1 1.4 0Z"
          clipRule="evenodd"
        />
      </svg>
      {children}
    </span>
  );
}

// A product preview that doubles as the hero visual — the "assigned pro" card.
function ProPreviewCard() {
  return (
    <div className="animate-rise [animation-delay:120ms]">
      <div className="relative mx-auto max-w-sm rounded-3xl border border-line bg-white p-6 shadow-[0_20px_60px_-30px_rgba(20,36,29,0.35)]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-sage">
            Your matched pro
          </span>
          <span className="rounded-full bg-emerald/10 px-2.5 py-1 text-xs font-medium text-emerald">
            Confirmed
          </span>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest font-display text-xl text-ivory">
            A
          </div>
          <div>
            <p className="font-medium text-ink">Amara O.</p>
            <p className="text-sm text-sage">★ 4.95 · 1,200+ five-star cleans</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {["Background-checked", "Academy Certified", "Eco-Certified"].map((b) => (
            <span key={b} className="rounded-full bg-cream px-2.5 py-1 text-xs text-ink">
              {b}
            </span>
          ))}
        </div>
        <div className="mt-6 space-y-2.5 rounded-2xl bg-ivory p-4 text-sm">
          <Row label="Standard Clean · 2 bd / 2 ba" value="$145.00" />
          <Row label="Every-2-weeks plan savings" value="−$14.50" muted />
          <Row label="Trust & Protection" value="$5.00" muted />
          <div className="my-1 border-t border-line" />
          <Row label="All-in, today" value="$135.50" bold />
        </div>
        <p className="mt-3 text-center text-xs text-sage">
          You&apos;re not charged until your clean is verified complete.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-sage" : bold ? "font-medium text-ink" : "text-ink"}>
        {label}
      </span>
      <span className={bold ? "font-display text-lg text-ink" : muted ? "text-sage" : "text-ink"}>
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------ Trust bar */

function TrustBar() {
  const stats = [
    ["4.9★", "Average clean rating"],
    ["80%", "Kept by your cleaner"],
    ["$0", "Surprise fees, ever"],
    ["$2M", "Insurance on every visit"],
  ];
  return (
    <section className="border-y border-line bg-cream">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-6 py-10 md:grid-cols-4">
        {stats.map(([big, small]) => (
          <div key={small} className="text-center">
            <p className="font-display text-3xl text-emerald">{big}</p>
            <p className="mt-1 text-sm text-sage">{small}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------- How it works */

function HowItWorks() {
  const steps = [
    ["Tell us about your home", "Size, schedule, and any extras. Get an all-in price instantly — every line itemized, nothing hidden."],
    ["Meet your matched pro", "Our engine assigns the best vetted pro for your home — and keeps them as yours, visit after visit."],
    ["Relax — it's guaranteed", "Photo-verified completion. Tip-optional, cashless. Not perfect? We re-clean within 24 hours, free."],
  ];
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHead
        eyebrow="How it works"
        title="Booking a clean should feel effortless"
        sub="Three steps. No phone tag, no quote auctions, no rotating strangers."
      />
      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {steps.map(([title, body], i) => (
          <div key={title} className="rounded-3xl border border-line bg-white p-7">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest font-display text-ivory">
              {i + 1}
            </div>
            <h3 className="mt-5 font-display text-xl text-ink">{title}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-sage">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- Why Lustre */

function WhyLustre() {
  const rows: [string, boolean, string, string][] = [
    ["Same pro every visit", true, "Random dispatch", "Whoever responds first"],
    ["All-in upfront price", true, "Stacked service + trust fees", "Hidden in quotes"],
    ["Vetted, trained & insured", true, "Background check only", "Often unverified"],
    ["Cleaner keeps 80%+", true, "Cleaner loses 50–75%", "Pays $40–200 per lead"],
    ["24-hr re-clean guarantee", true, "Booking fee on no-shows", "No recourse"],
  ];
  return (
    <section id="why" className="border-y border-line bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <SectionHead
          eyebrow="Why Lustre"
          title="The gig apps optimize for fill-rate. We optimize for you."
          sub="We rebuilt the model around fairly-paid, loyal cleaners — because consistent quality is downstream of treating people well."
        />
        <div className="mt-12 overflow-hidden rounded-3xl border border-line bg-white">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-px bg-line text-sm">
            <HeadCell className="bg-white" />
            <HeadCell className="bg-forest text-ivory">Lustre</HeadCell>
            <HeadCell className="bg-white text-sage">Gig apps</HeadCell>
            <HeadCell className="bg-white text-sage">Lead sites</HeadCell>
            {rows.map(([label, lustre, gig, lead]) => (
              <Fragmented key={label} label={label} lustre={lustre} gig={gig} lead={lead} />
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-sage">
          &ldquo;Gig apps&rdquo; e.g. Handy, TaskRabbit · &ldquo;Lead sites&rdquo; e.g. Thumbtack, Angi.
          Comparisons reflect publicly documented models &amp; complaints.
        </p>
      </div>
    </section>
  );
}

function HeadCell({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`px-5 py-4 font-semibold ${className}`}>{children}</div>
  );
}

function Fragmented({
  label,
  lustre,
  gig,
  lead,
}: {
  label: string;
  lustre: boolean;
  gig: string;
  lead: string;
}) {
  return (
    <>
      <div className="bg-white px-5 py-4 font-medium text-ink">{label}</div>
      <div className="flex items-center gap-2 bg-emerald/5 px-5 py-4 text-emerald">
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden>
          <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.1 3.1 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
        </svg>
        {lustre ? "Yes" : ""}
      </div>
      <div className="bg-white px-5 py-4 text-sage">{gig}</div>
      <div className="bg-white px-5 py-4 text-sage">{lead}</div>
    </>
  );
}

/* ------------------------------------------------------------- Pricing */

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid items-center gap-14 md:grid-cols-2">
        <div>
          <SectionHead
            align="left"
            eyebrow="Transparent pricing"
            title="One number. Every line shown."
            sub="No per-room surprises at the door. No 20% &ldquo;trust &amp; support&rdquo; fee stacked at checkout. The price you see is the price you pay."
          />
          <ul className="mt-8 space-y-4">
            {[
              ["All-in quote before you book", "Base, add-ons, plan savings and one named protection fee — itemized."],
              ["Recurring is cheaper", "Weekly and biweekly plans are discounted, not surcharged."],
              ["Tip-optional, cashless", "Pay once. Your pro is paid fairly without awkward tipping."],
            ].map(([t, b]) => (
              <li key={t} className="flex gap-3">
                <LustreMark className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <p className="font-medium text-ink">{t}</p>
                  <p className="text-sm text-sage">{b}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/book"
            className="mt-9 inline-flex rounded-full bg-forest px-7 py-3.5 text-sm font-medium text-ivory transition-colors hover:bg-emerald"
          >
            Get your instant price
          </Link>
        </div>

        <div className="rounded-3xl border border-line bg-white p-8 shadow-[0_20px_60px_-30px_rgba(20,36,29,0.3)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-sage">Example · Deep clean</p>
          <p className="mt-1 font-display text-2xl text-ink">3 bd / 2 ba · biweekly</p>
          <div className="mt-6 space-y-3 text-sm">
            <Row label="Deep Clean · 3 bd / 2 ba" value="$257.00" />
            <Row label="Inside fridge" value="$25.00" muted />
            <Row label="Eco / non-toxic products" value="$15.00" muted />
            <Row label="Every-2-weeks plan savings" value="−$29.70" muted />
            <Row label="Trust & Protection" value="$5.00" muted />
            <div className="border-t border-line" />
            <Row label="All-in total" value="$272.30" bold />
          </div>
          <p className="mt-4 rounded-2xl bg-cream p-3 text-center text-xs text-sage">
            Your cleaner keeps <span className="font-medium text-ink">$213.84</span> of this — vs ~$80 on a typical gig app.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- Membership */

function Membership() {
  const tiers = [
    {
      name: "Pay as you go",
      price: "$0",
      cadence: "",
      features: ["All-in transparent pricing", "Vetted, insured pros", "24-hr re-clean guarantee"],
      cta: "Book a clean",
      highlight: false,
    },
    {
      name: "Lustre+",
      price: "$29",
      cadence: "/mo",
      features: ["Priority booking & top pros", "Locked-in member pricing", "Free re-cleans, no questions", "Dedicated concierge"],
      cta: "Start Lustre+",
      highlight: true,
    },
    {
      name: "Premier",
      price: "$49",
      cadence: "/mo",
      features: ["Everything in Lustre+", "Guaranteed same-day rebooking", "Quarterly deep clean credit", "White-glove account manager"],
      cta: "Go Premier",
      highlight: false,
    },
  ];
  return (
    <section id="membership" className="border-y border-line bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <SectionHead
          eyebrow="Membership"
          title="Make a spotless home a habit"
          sub="Members book the best pros first and lock in their pricing. Cancel anytime."
        />
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-3xl border p-8 ${
                t.highlight
                  ? "border-emerald bg-forest text-ivory shadow-[0_24px_70px_-30px_rgba(30,58,47,0.6)]"
                  : "border-line bg-white"
              }`}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-8 rounded-full bg-gold px-3 py-1 text-xs font-medium text-ink">
                  Most popular
                </span>
              )}
              <h3 className={`font-display text-xl ${t.highlight ? "text-ivory" : "text-ink"}`}>
                {t.name}
              </h3>
              <p className="mt-3">
                <span className={`font-display text-4xl ${t.highlight ? "text-ivory" : "text-ink"}`}>
                  {t.price}
                </span>
                <span className={t.highlight ? "text-ivory/70" : "text-sage"}>{t.cadence}</span>
              </p>
              <ul className={`mt-6 space-y-3 text-sm ${t.highlight ? "text-ivory/90" : "text-sage"}`}>
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <span className={t.highlight ? "text-gold-soft" : "text-gold"}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/book"
                className={`mt-8 block rounded-full px-5 py-3 text-center text-sm font-medium transition-colors ${
                  t.highlight
                    ? "bg-ivory text-forest hover:bg-cream"
                    : "bg-forest text-ivory hover:bg-emerald"
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- Cleaners */

function Cleaners() {
  return (
    <section id="cleaners" className="mx-auto max-w-6xl px-6 py-24">
      <div className="overflow-hidden rounded-3xl bg-forest px-8 py-14 text-ivory md:px-14">
        <div className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-soft">
              For cleaners
            </span>
            <h2 className="mt-3 font-display text-3xl leading-tight md:text-4xl">
              Keep 80% of every job. Keep your clients. Get paid instantly.
            </h2>
            <p className="mt-5 max-w-lg text-ivory/80">
              No pay-per-lead. No $1.99-to-get-paid. No silent deactivations. Build a
              real book of repeat clients that&apos;s yours — and bring your own
              software if you already run Jobber or Housecall Pro.
            </p>
            <Link
              href="/book"
              className="mt-8 inline-flex rounded-full bg-ivory px-7 py-3.5 text-sm font-medium text-forest transition-colors hover:bg-cream"
            >
              Become a Lustre pro
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["80%+", "take-home pay"],
              ["Instant", "free payouts"],
              ["Your", "clients, kept"],
              ["Fair", "rules + appeals"],
            ].map(([big, small]) => (
              <div key={small} className="rounded-2xl bg-ivory/10 p-5 backdrop-blur">
                <p className="font-display text-2xl text-ivory">{big}</p>
                <p className="text-sm text-ivory/70">{small}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Guarantee */

function Guarantee() {
  return (
    <section id="guarantee" className="border-t border-line bg-cream">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <LustreMark className="mx-auto h-8 w-8 text-gold" />
        <h2 className="mt-5 font-display text-3xl text-ink md:text-4xl">
          The Lustre Guarantee
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-sage">
          If your clean isn&apos;t perfect, tell us within 24 hours and we&apos;ll
          send a pro back to make it right — free. Every visit is insured to $2M and
          backed by photo-verified completion. That&apos;s the whole point of doing
          this properly.
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- Final CTA */

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-white px-8 py-16 text-center">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-champagne/50 blur-3xl" />
        <div className="relative">
          <h2 className="font-display text-4xl text-ink md:text-5xl">
            A spotless home is one tap away.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sage">
            Get your all-in price and meet your matched pro in under a minute.
          </p>
          <Link
            href="/book"
            className="mt-8 inline-flex rounded-full bg-forest px-8 py-4 text-sm font-medium text-ivory transition-colors hover:bg-emerald"
          >
            Book a clean
          </Link>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- Primitives */

function SectionHead({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <span className="text-xs font-semibold uppercase tracking-wider text-gold">{eyebrow}</span>
      <h2 className="mt-3 font-display text-3xl leading-tight text-ink md:text-4xl text-balance">
        {title}
      </h2>
      {sub && <p className="mt-4 leading-relaxed text-sage">{sub}</p>}
    </div>
  );
}

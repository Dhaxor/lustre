# Lustre — *Your cleaner. Guaranteed.*

A premium, managed cleaning **aggregator**: one customer books a clean, and our
engine matches and routes the job to the best fulfillment source — our own
vetted pros, an independent cleaning company's software, a Handy partnership, or
a lead-gen fallback — all behind one interface.

This repo contains the **research + strategy** that shaped the product and a
**runnable Phase-0 build** (Next.js) with a fully unit-tested domain core.

---

## The one insight that shaped everything

We researched the incumbents (Handy, TaskRabbit, Thumbtack, Angi, Urban Company)
and the SaaS cleaning tools (Jobber, Housecall Pro, BookingKoala, ZenMaid…). The
decisive finding:

> **There is almost no bookable cleaning-provider API to "connect" to.** Only
> Handy exposes one, and it's a sales-gated B2B partnership. Housecall Pro /
> Jobber / BookingKoala APIs are *single-tenant* (they automate one company's own
> jobs). Thumbtack / Angi are lead-gen, not booking.

So pure API aggregation is a myth. The winning architecture — proven by DoorDash
and the travel OTAs — is a **hybrid managed marketplace**: build most of the
supply yourself (vetted, trained pros), use APIs as accelerants where they exist,
and put everything behind one pluggable `SupplyAdapter` so the matching engine is
source-agnostic. The durable moat is **fair cleaner economics → loyal supply →
consistent quality**, plus **transparent pricing** and a **satisfaction
guarantee** — exactly the things every incumbent fails at.

Full write-up in [`docs/`](docs/):
- [`01-market-research.md`](docs/01-market-research.md) — incumbents, models, gaps, sources
- [`02-strategy-and-monetization.md`](docs/02-strategy-and-monetization.md) — positioning, take-rate stack, unit economics
- [`03-architecture.md`](docs/03-architecture.md) — system design, adapters, payments, roadmap

---

## How we make money (the take-rate stack)

A single commission is fragile, so we stack transparent lines for a **blended
~22–28% of GMV** (a16z "managed marketplaces earn 10–30%"):

| Line | Rate |
|---|---|
| Service commission (managed pool) | 20% — cleaner keeps 80% |
| Connected-provider commission | 10–12% (never on their repeat clients) |
| Lustre+ / Premier membership | $29–49/mo |
| Payment convenience margin | ~1% over Stripe cost |
| Trust & Protection add-on | $3–6 / booking |
| Provider tools subscription, featured placement, lead-gen fallback | varies |

Worked example (a $150 job): cleaner takes $116, Lustre nets **~$26 (≈17% of GMV)**
after Stripe + guarantee reserve. Recurring is the engine — biweekly ≈ 26 jobs/yr.

---

## The build (Phase 0 — runnable today)

A Next.js 16 app with a **framework-free, unit-tested domain core** — the real IP.

```
lustre/
├─ docs/                         # market research + strategy + architecture
└─ web/
   ├─ src/core/                  # the aggregation engine (pure TypeScript)
   │  ├─ pricing.ts              # transparent, all-in, itemized PricingEngine
   │  ├─ matching.ts             # source-agnostic MatchingEngine (continuity-first)
   │  ├─ booking-service.ts      # quote→match→escrow-hold→book(+fallback)→ledger
   │  ├─ payments.ts             # PaymentService iface (+ FakePaymentService)
   │  ├─ catalog.ts              # services, add-ons, zones, commission config
   │  ├─ supply/                 # the pluggable supply layer
   │  │  ├─ adapter.ts           #   SupplyAdapter interface + SupplyOffer
   │  │  ├─ managed-pool.ts      #   our vetted pros (core, fully functional)
   │  │  ├─ connected-provider.ts#   Jobber/Housecall Pro shops (stubbed externals)
   │  │  ├─ handy.ts             #   Handy Orders API (gated, stubbed)
   │  │  └─ leadgen.ts           #   monetized fallback — never drops demand
   │  └─ __tests__/              # 14 unit tests (pricing, matching, booking, ledger)
   ├─ src/app/                   # landing page, /book flow, /api/{quote,match,book}
   └─ src/components/            # premium UI (site chrome + booking flow)
```

### Run it

```bash
cd web
npm install
npm run dev          # http://localhost:3000  (landing + /book)
npm test             # 14 unit tests
npx tsc --noEmit     # typecheck
```

### What works end-to-end right now

- **Premium marketing site** — hero, transparent-pricing comparison vs incumbents, membership tiers, two-sided (cleaner) pitch, guarantee.
- **Live booking flow** — service → home → schedule → extras → **match** → escrow confirm, with an itemized live quote that updates as you go.
- **Real aggregation engine** behind `/api/match` + `/api/book`: continuity ("your preferred pro" wins), multi-source ranking, **capacity-aware auto-fallback** (managed → connected → lead-gen), and a per-job **ledger** that ties to the unit-economics in the docs.

### Payments — Stripe Connect escrow (opt-in)

The `PaymentService` interface now has a real **Stripe Connect** implementation
alongside the in-memory fake. It activates automatically when keys are present:

- **Demo mode** (no keys): in-memory `FakePaymentService`, no real charges.
- **Real mode** (keys in `web/.env.local`): escrow via manual-capture
  PaymentIntents — card collected with **Stripe Elements**, **server-side
  amount verification** in `/api/book` (blocks price tampering), capture on
  verified completion, **Connect Express** cleaner onboarding (`/api/connect/onboard`),
  payouts via Transfers, and a **signature-verified webhook** (`/api/stripe/webhook`).

You never hand a key to anyone — see **[STRIPE_SETUP.md](STRIPE_SETUP.md)** for the
exact dashboard checklist. Start in test mode (`sk_test_…`).

### Roadmap (what slots in behind the existing interfaces)

- **Phase 1:** Postgres/Prisma; real Stripe Connect Express (escrow split); Checkr vetting; pro onboarding; photo-verified completion + re-clean flow.
- **Phase 2:** real Jobber + Housecall Pro connectors; recurrence runner; membership; assigned-pro continuity.
- **Phase 3:** STR/Airbnb turnover product; pro mobile app; AI concierge; commercial; 2nd metro.
- **Phase 4:** Handy partnership live; lead-gen monetization; featured placement; analytics.

Because the core is built inside-out against interfaces, none of the above
requires touching the engine — only swapping the `Fake*` / stubbed implementations
for real ones.

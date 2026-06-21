# Lustre — Architecture & Roadmap

The product thesis (`02-strategy`) forces the architecture: because bookable supply APIs barely exist, the system is a **managed marketplace with a pluggable supply layer**. One customer booking is matched and routed to whichever fulfillment source can deliver it best — our own managed pool, a connected provider's software, a Handy partnership, or a lead-gen fallback — all behind a single interface.

---

## 1. System overview

```
                         ┌──────────────────────────────┐
   Customer  ───────────▶│   Booking experience (web)   │  Next.js App Router
   (web/app)             │  landing · quote · checkout  │  premium, transparent
                         └───────────────┬──────────────┘
                                         │  REST/Server Actions
                         ┌───────────────▼──────────────┐
                         │        Domain core (TS)       │  pure, unit-tested,
                         │                               │  framework-agnostic
                         │  PricingEngine                │  all-in transparent price
                         │  MatchingEngine               │  score & select supply
                         │  BookingService               │  orchestrates lifecycle
                         │  PaymentService (Stripe iface)│  hold → capture → split
                         │  GuaranteeService             │  re-clean / refund logic
                         └───────────────┬──────────────┘
                                         │  SupplyAdapter (one interface)
            ┌────────────────┬───────────┴─────────┬────────────────────┐
            ▼                ▼                     ▼                    ▼
   ManagedPoolAdapter  ConnectedProvider*    HandyAdapter         LeadGenAdapter
   (our vetted pros,   (Jobber / Housecall   (Orders API,         (overflow →
    DB-backed, the     Pro single-tenant     sales-gated B2B      qualified lead)
    core supply)       APIs / Zapier)        partnership)
```

**Key principle:** the matching engine never knows *how* a job is fulfilled. It asks every adapter "can you cover this request, at what price, quality, and availability?" gets back normalized `SupplyOffer`s, scores them, and books the winner through the same interface. New supply sources = new adapters, zero core changes.

---

## 2. The `SupplyAdapter` interface (the heart of the aggregator)

```ts
interface SupplyAdapter {
  readonly source: SupplySource;            // 'managed' | 'connected' | 'handy' | 'leadgen'

  // Async, non-blocking: return normalized offers this source can fulfill.
  getOffers(req: BookingRequest): Promise<SupplyOffer[]>;

  // Commit a booking against a chosen offer. Idempotent.
  book(offer: SupplyOffer, req: BookingRequest): Promise<FulfillmentResult>;

  // Lifecycle hooks (cancel, reschedule, completion webhook ingestion).
  cancel(fulfillmentId: string, reason: CancelReason): Promise<void>;
  onWebhook?(event: ProviderWebhook): Promise<DomainEvent[]>;
}
```

Every adapter normalizes its source into a common `SupplyOffer` (price, eta/slot, assigned-pro id, rating, capacityConfidence, source). This mirrors how DoorDash/OTAs normalize heterogeneous suppliers into one catalog. Ingestion is **async + webhook-driven** (DoorDash pattern): `getOffers` may consult a cached availability projection; `book` returns immediately and confirmation arrives via `onWebhook`.

### Adapters at launch
- **`ManagedPoolAdapter`** — queries our DB of vetted pros (coverage zip, availability slots, skills, rating, continuity with this customer). Books by reserving a pro's slot. **Fully functional end-to-end** (this is the demo + the real core).
- **`ConnectedProviderAdapter`** — wraps a provider's single-tenant system (Jobber GraphQL / Housecall Pro REST / Zapier webhook bridge). Pulls availability into a local projection; pushes a job on `book`. *Interface-correct, stubbed external calls.*
- **`HandyAdapter`** — Handy Orders API (availability → priced order → webhook confirmation). *Interface-correct, stubbed; gated behind partnership flag.*
- **`LeadGenAdapter`** — always "covers" (lowest priority); converts an unfulfillable request into a qualified lead record.

---

## 3. Matching engine

Given a `BookingRequest` and the union of all adapter offers, score and select:

```
score(offer) =  w_continuity * sameProAsBefore        // assigned-pro promise (highest weight)
             +  w_quality    * normalizedRating
             +  w_reliability* capacityConfidence       // will they actually show?
             +  w_price      * priceCompetitiveness
             +  w_source     * sourcePreference          // managed > connected > handy > leadgen
             -  penalties     (distance, slot mismatch, over-capacity)
```

- **Continuity is weighted highest** — delivering "your cleaner, guaranteed" is the core promise. If the customer has a preferred/assigned pro and they're available, they win barring a hard constraint.
- **Reliability (capacityConfidence)** guards the no-show failure mode that defines the incumbents.
- **Source preference** keeps margin and quality in-house first, falling through to partners only for coverage gaps.
- Weights are config, A/B-testable. Output: a ranked list; engine books the top offer, with automatic fallback to the next on `book` failure (this is the "backup auto-dispatch" reliability guarantee).

---

## 4. Pricing engine (transparent, all-in)

Anti-incumbent by design: **one number, every component shown, computed before payment, no surprise add-ons.**

```
price = base(serviceType, bedrooms, bathrooms)
      + addOns(deep, fridge, oven, laundry, …)        // explicit catalog items
      + frequencyAdjustment(oneTime|weekly|biweekly|monthly)   // recurring = cheaper
      + zoneAdjustment(zip cost tier)                 // static tiers, NOT surge
      + trustAndProtection                            // the named guarantee fee
      − membershipDiscount(Lustre+ tier)
      − promo
```

Returns a `PriceQuote` with a line-item breakdown rendered verbatim at checkout. **No** dynamic/surge pricing at launch (research: cleaning rewards transparency, not surge). Recurring frequency is *discounted* to drive the recurring-revenue flywheel.

---

## 5. Payments (Stripe Connect, escrow-style)

- **Express connected accounts** for cleaners (Stripe-hosted KYC/onboarding).
- **Destination charge** on booking: customer charged the all-in price; `application_fee_amount` = Lustre's commission + add-on; remainder routed to the pro's account. Per-transaction split → commission can vary by source (20% managed / 10–12% connected).
- **Escrow-by-design:** authorize/hold on booking, **capture on photo-verified completion**, transfer to pro on guarantee window close (e.g. 24h). Protects against no-shows and funds the re-clean guarantee.
- **Cost modeled at ~3.9% of GMV** (3.5–5% range). `PaymentService` is an interface (`StripeConnectPaymentService` impl + an in-memory `FakePaymentService` for tests/demo) so the domain core stays provider-agnostic and fully testable offline.

---

## 6. Data model (core entities)

```
Customer(id, contact, addresses[], preferredProId?, membershipTier)
Address(id, zip, beds, baths, sqft, accessNotes, parking)
Pro(id, source, name, skills[], rating, coverageZips[], certifications[], payoutAccountId)
Availability(proId, slot, capacity)                       // projection, refreshed via webhook/poll
Service(type, basePrice, durationEst, taxonomyKey)        // canonical taxonomy
AddOn(key, price, durationDelta)
BookingRequest(customerId, addressId, service, addOns[], frequency, window)
PriceQuote(requestId, lineItems[], total, currency)
Booking(id, requestId, proId, source, status, quote, paymentIntentId,
        assignedPro, recurrencePlanId?)
RecurrencePlan(id, customerId, cadence, anchorPro, nextRun)
Fulfillment(id, bookingId, source, externalRef, status, photos[], checklist)
GuaranteeClaim(bookingId, type: reclean|refund, status)
LedgerEntry(bookingId, gross, proPayout, commission, fees, reserve)   // unit-economics truth
```

`status` lifecycle: `quoted → booked → assigned → in_progress → completed → verified → settled` (+ `cancelled`, `reclean_requested`). Canonical `Service.taxonomyKey` is the mapping target that normalizes connected-provider/Handy SKUs into our catalog (the OTA "mapping layer").

---

## 7. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Web | **Next.js 15 (App Router) + TypeScript + Tailwind** | One stack for premium marketing + booking + server actions; SSR for SEO on the consumer side |
| Domain core | **Pure TypeScript** (`src/core`), no framework deps | Unit-testable, reusable across web/api/workers; the real IP |
| Tests | **Vitest** | Fast; core engines covered before any UI |
| DB | **Postgres + Prisma** (SQLite for local/demo) | Relational fits the booking/ledger model; easy local dev |
| Payments | **Stripe Connect (Express)** | Marketplace standard; destination charges + escrow |
| Vetting | **Checkr** + Stripe Identity | Gig-standard background checks + ID |
| Async | webhook ingestion + a job runner (later: queue) | DoorDash-style async supply, recurring-plan runs |
| Hosting | Vercel (web) + managed Postgres | Matches the team's existing Vercel workflow |

**Build order is inside-out:** the domain core (pricing, matching, adapters, payments) is built and unit-tested *first* with in-memory implementations, so the entire booking flow works end-to-end in a demo with zero external dependencies. Real Stripe/Checkr/Jobber wiring slots in behind the existing interfaces without touching the core.

---

## 8. Roadmap

**Phase 0 — Foundation (this session).** Domain core: `SupplyAdapter` + `ManagedPoolAdapter`, `MatchingEngine`, `PricingEngine`, `PaymentService` (fake impl), `BookingService`. Unit tests green. Premium landing + multi-step booking flow + live quote + match + mock checkout, wired to the core via API routes. **Runnable end-to-end.**

**Phase 1 — Real supply & payments.** Postgres/Prisma; Stripe Connect Express (real escrow split); Checkr vetting; pro onboarding + availability calendar; photo-verified completion + re-clean guarantee flow.

**Phase 2 — Connected providers & recurring.** Jobber + Housecall Pro adapters (real APIs) + Zapier bridge; recurrence-plan runner; Lustre+ membership; assigned-pro continuity in matching.

**Phase 3 — Beachhead scale.** STR/Airbnb calendar-sync turnover product; provider mobile app; concierge + AI booking; commercial contracts; second metro.

**Phase 4 — Optimization.** Handy partnership adapter live; lead-gen fallback monetization; featured placement; dynamic capacity balancing; analytics/KPI dashboards.

---

## 9. Where each research finding lives in the architecture

| Research finding | Architectural answer |
|---|---|
| No bookable supply APIs | `SupplyAdapter` hybrid; managed pool is the core, APIs are accelerants |
| No-shows define incumbents | `capacityConfidence` in matching + escrow capture-on-completion + auto-fallback |
| Fee opacity is the #1 complaint | `PricingEngine` line-item all-in quote, rendered verbatim, no surge |
| Continuity is the top unmet need | `w_continuity` highest weight + `RecurrencePlan.anchorPro` |
| Extractive provider economics | 80% payout, per-source commission split in `PaymentService`, no lead fees |
| Don't claw back repeat clients | Connected-provider commission only on net-new demand (ledger-enforced) |
| Trust/safety sells premium | `GuaranteeService` (re-clean/refund) + Checkr/insurance reserve in ledger |

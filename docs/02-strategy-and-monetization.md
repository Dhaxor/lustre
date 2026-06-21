# Lustre — Strategy & Monetization

> **Lustre** — *Your cleaner. Guaranteed.*
> A premium, managed cleaning marketplace. One vetted, trained, photo-verified pro who returns every visit. All-in transparent pricing, no surprise fees, satisfaction guaranteed or we re-clean free.

---

## 1. Positioning

The whole market splits into two losing extremes:

- **Gig/lead marketplaces (Handy, TaskRabbit, Thumbtack, Angi):** cheap to start, but commoditized labor → no-shows, rotating strangers, opaque fees, 1.4–1.5★ reputations, regulators circling.
- **Back-office SaaS (Jobber, Housecall Pro, ZenMaid…):** good tools for *one* cleaning company, but no demand generation and no consumer trust layer.

**Lustre takes the unoccupied middle-premium position** that Urban Company proved in India but no one owns in the West: a **managed marketplace** where the *experience is the product*. We don't sell leads; we deliver a guaranteed outcome. We compete on **trust and consistency**, not price.

### The two-sided promise

| To the customer | To the cleaner |
|---|---|
| The **same vetted pro** every visit (continuity) | **Keep "your" clients** — a real book of business, portable reputation |
| **All-in upfront price**, zero surprise fees, tip-optional | **80%+ take-home**, transparent split, **no pay-per-lead** |
| **Reliable show-up** (capacity-backed, backup auto-dispatch) | **Steady, guaranteed work**, instant free payouts |
| **Satisfaction guarantee** — free re-clean in 24h, insured to $2M | **Fair penalty rules with human appeals** (no silent deactivation) |
| **Photo-verified** completion + concierge support | Training, certification, supplied kits → command premium rates |

> The flywheel: **fair economics → happy supply → reliable, high-quality service → premium prices → more demand → more steady work for cleaners.** Provider happiness is upstream of everything customers value. That is the moat the incumbents structurally cannot copy without abandoning their fill-rate model.

---

## 2. Beachhead → expansion sequence

1. **Phase A — STR / Airbnb turnover (B2B, high-LTV beachhead).** Recurring-by-default, calendar-synced, price-inelastic, photo-QA already expected. Lowest CAC, structural retention. Seeds a vetted pro network. *(Market: $72B→$125B; 8.1M listings.)*
2. **Phase B — Premium recurring residential (B2C core).** Point the vetted network at homeowners who want "their cleaner, guaranteed." Membership-led. *(Market: ~$17B US residential, mostly offline.)*
3. **Phase C — Commercial / office contracts.** Long-term agreements = 63% of revenue; locked-in retention; expands pro utilization on weekdays.

One geography, one metro, dense supply first (marketplace liquidity beats breadth). Launch metro chosen for STR density + high household income.

---

## 3. Supply strategy — the hybrid that makes it real

Because **bookable provider APIs barely exist** (only Handy, sales-gated), supply is a deliberate hybrid, ranked by control:

1. **Managed pool (core, ~70% of supply):** cleaners we vet, train, certify, equip, and onboard into our catalog. Highest quality + margin + control. This *is* the product.
2. **Connected providers (accelerant):** independent cleaning companies that already run **Jobber / Housecall Pro / BookingKoala** — we sync their availability via their single-tenant APIs and route them overflow. Zero onboarding friction for them.
3. **Handy partnership (overflow/coverage):** white-label fulfillment via the Handy Orders API for zips/slots we can't cover natively. *(BD action: email partnerships@handy.com.)*
4. **Lead-gen fallback (last resort):** jobs we cannot fulfill in-network are monetized as qualified leads rather than dropped.

All four sit behind **one `SupplyAdapter` interface** so the matching engine is source-agnostic (see `03-architecture.md`).

---

## 4. How we make money — the take-rate stack

A single commission is fragile. Following the a16z/Tidemark "managed marketplaces earn 10–30%" law, Lustre stacks revenue lines so **blended take ≈ 22–28% of GMV**, while *each line is transparent to both sides*:

| # | Revenue line | Rate | Notes |
|---|---|---|---|
| 1 | **Service commission** (managed pool) | **20%** of job value | Earned only on *completed, verified* jobs. Cleaner keeps **80%** — vs. Handy's ~30%. |
| 2 | **Connected-provider commission** | **10–12%** | Lower take — they bring their own supply/ops; we bring net-new demand. We **never** charge on their pre-existing repeat clients (fixes Fresha's #1 grievance). |
| 3 | **Lustre+ membership** (consumer) | **$24–49/mo** tiers | Priority booking, locked pricing, premium pro access, free re-cleans. 51% expect a plan; subscribers = 3–5× LTV. |
| 4 | **Payment convenience margin** | **~1%** over Stripe cost | Clearly disclosed; covers instant payouts + guarantee fund. |
| 5 | **Trust & protection add-on** | **$3–6 / booking** | Funds the $2M insurance + re-clean guarantee + 24/7 support. Optional but default-on; near-zero marginal cost (re-clean lever). |
| 6 | **Provider tools subscription** | **$0–29/mo** | Connected providers can upgrade to Lustre scheduling/CRM/route tools. Pure SaaS margin. |
| 7 | **Featured placement / boosts** | CPC/CPM | Only after liquidity; never pay-to-work credits (the Urban Company grievance). |
| 8 | **Lead-gen fallback** | per qualified lead | Monetizes unfulfillable demand instead of dropping it. |

**Deliberate anti-fees** (our marketing weapon): no per-seat pricing, no surprise "trust & support" surcharge stacked on the customer at checkout, no clawback on a provider's own repeat clients, no $1.99-to-get-paid-faster, no cancellation traps. *Every fee is named and shown before payment.*

---

## 5. Unit economics (illustrative, single recurring residential job)

Assume an **all-in customer price of $150** for a standard recurring clean (transparent, no add-on surprises).

```
Customer pays (all-in)                     $150.00
  ├─ Trust & protection add-on (in-price)    $5.00
  └─ Service subtotal                       $145.00

Cleaner payout (80% of service subtotal)   $116.00   → cleaner keeps 80%, no lead fee
Lustre gross (commission 20% + add-on)      $34.00   ($29.00 + $5.00)

Stripe Connect cost (~3.9% of $150)         ($5.85)
Guarantee/insurance reserve (~$2/job)       ($2.00)
─────────────────────────────────────────────────
Lustre contribution / job                   $26.15   (~17.4% net margin on GMV)
```

- **Recurring is the whole game.** A biweekly customer = ~26 jobs/yr → **~$680 net/customer/yr** before membership. With Lustre+ at $29/mo that's **+$348/yr** at ~95% margin.
- **LTV:CAC target 3:1+**, residential churn <5%/mo. STR/commercial beachhead lowers blended CAC and lifts retention (structural recurring).
- **Cleaner take-home beats every incumbent** ($116 vs. Handy's ~$40–70 on a comparable charge), which is *why* supply stays and quality holds.

---

## 6. Why we win (defensibility)

1. **Provider economics moat** — incumbents can't pay cleaners 80% + give them client ownership without breaking their auction/fill-rate model. We're built around it.
2. **Continuity + guarantee** — "same pro, guaranteed, or we re-clean free" is operationally impossible for a lead-auction; it requires a *managed* network.
3. **Connector-first** — connected providers keep their existing Jobber/Housecall Pro back-office; we add demand on top instead of forcing a rip-and-replace. Lower supply CAC.
4. **Trust as product** — vetting/training/insurance/photo-QA bundled and *marketed*, in a category defined by theft fear and no-shows.
5. **Beachhead discipline** — win high-retention STR/commercial first, then expand to consumer with a network already proven.

---

## 7. North-star & guardrails

- **North star:** *recurring jobs completed per month at ≥4.8★ with the same assigned pro.* (Captures liquidity, quality, retention, and continuity in one number.)
- **Guardrails:** cleaner effective take-home ≥80% and ≥ market; re-clean rate <3%; no-show rate <1%; every fee disclosed pre-payment.
- **Do-not-do:** pay-per-lead, surge/dynamic pricing at launch, per-seat pricing, clawing back providers' repeat clients, silent deactivations.

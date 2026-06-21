# Market Research — Premium Cleaning Aggregator

*Compiled June 2026 from live web research across SEC/FTC filings, vendor pricing pages, market-research firms (Fortune Business Insights, Grand View, IBISWorld, Mordor), and consumer/provider review aggregators. All figures source-linked; divergences flagged.*

---

## TL;DR — the five findings that shape the product

1. **The market is huge, fast-growing, mostly offline, and hyper-fragmented.** ~$17B US residential maid services + $112B US janitorial; ~1.25M US cleaning businesses; the 50 largest janitorial firms make only ~30% of revenue; **64% of cleaning businesses earn <$100K/yr**. Only ~40% of consumers book online today (up from 15% in 2018). No dominant trusted consumer brand exists. **Textbook conditions for a premium aggregator.**

2. **The incumbents are widely hated — and that's the opening.** Handy is a **1.4/5** brand (6% recommend); the FTC + NY AG forced **$2.95M in refunds (Jan 2025)** over deceptive pay ads and opaque fees. Thumbtack/Angi sell the *same lead to 3–8 pros*; HomeAdvisor paid a **$7.2M FTC settlement (2023)**. Every incumbent's #1 complaints are **no-shows, inconsistent quality, opaque fees, and provider churn.**

3. **"Connect to provider APIs" is mostly a myth — there is almost no bookable supply API.** Of every player researched, **only Handy** exposes a true book-a-job API, and it's a **sales-gated B2B partnership** (it's how Walmart/Wayfair sell in-home services at checkout). Housecall Pro / Jobber / BookingKoala APIs are **single-tenant** — they automate *one cleaning company's own* jobs, not a network. Thumbtack/Angi APIs are **lead-gen webhooks, not booking.** → Our supply strategy must be a **hybrid**, not pure API aggregation.

4. **Provider economics are extractive everywhere, which is why quality collapses.** Handy cleaners lose **50–75%** of the customer charge; Thumbtack cleaning leads went from $9–13 to **$40–200/lead**, shared 4–5 ways; Urban Company partners net ~25% after stacked deductions (live protests). **Unhappy, underpaid supply → no-shows and churn → bad customer experience.** Fixing provider economics is the actual moat.

5. **Nobody owns "premium, consistent, instant-booked cleaning" in the West.** Urban Company proved the *managed* model (train + certify + equip + standardize) but only in India/MENA/Singapore. TaskRabbit is generalist gig labor; Handy/Angi are lead-gen-first with no-show problems. **The position is unoccupied.**

---

## 1. The on-demand marketplaces (our reputation benchmark)

| Player | Model | Take / fees | Booking | Top complaints |
|---|---|---|---|---|
| **Handy** (Angi-owned) | Commission on completed job | Pro loses ~50–75% of charge; $1.99 instant-pay fee; $50 "Pro No-Show" fine | Instant, pre-priced | **No-shows**, theft reports, opaque deductions; **FTC/NY AG $2.95M refund (2025)**; 1.4/5 |
| **TaskRabbit** (IKEA-owned) | Take loaded on customer | **15% service fee + ~7.5% trust fee** (~22%+ blended); $25 tasker reg | Instant, pick a tasker | Stacked "trust & support" fees ($118 on a $450 job); no-shows; ~1.5/5 |
| **Thumbtack** | Pay-per-lead auction | Cleaning lead ~$8–20 → escalates to $40–200; **shared 4–5 pros** | Quote/lead + Instant Book | Fake/ghost leads, refunds denied, chargeback → permanent ban; BBB 1,000+ complaints |
| **Angi** (Angie's+HomeAdvisor) | Lead/ads (~70%) + Angi Services commission | Leads $15–85+, shared 3–8 pros; $288–300/yr | Lead/quote + pre-priced | Shared low-quality leads, 12-mo contracts w/ 35% early-term fee; **FTC $7.2M (2023)** |
| **Urban Company** ⭐ | **Managed marketplace** | ~20–30% commission (~28% blended) + subscriptions + lead credits | Instant, pre-priced, **assigned trained pro** | Partner economics/protests — but **customer experience is the premium benchmark** |

**Cross-cutting gaps a premium entrant exploits:** (1) the lead-auction model is broken on both sides — *only earn when a real job is delivered*; (2) fee opacity is the universal #1 complaint — *all-in transparent pricing*; (3) US vetting is shallow (Checkr background check, no training) — *train + certify + equip like Urban Company*; (4) extractive provider economics drive churn — *fair, transparent splits*; (5) no Western player owns premium consistent cleaning — *take the position*.

---

## 2. The B2B SaaS the cleaning businesses actually run

These are **pure back-office software** (not marketplaces) — relevant because they're our **supply-side integration targets** and they reveal what owners hate.

| Product | Entry price | API surface | Notes |
|---|---|---|---|
| **Jobber** | $49→$699/mo (API on $699 Plus) | **Best: public GraphQL API + 200K-pro app marketplace** | Per-user pricing balloons; reporting gaps |
| **Housecall Pro** | $59→$299/mo (**open API on MAX only**) | Good but gated to top tier | "Cost creep" 5–9× advertised; cancellation traps (BBB) |
| **BookingKoala** | ~$27–79/mo | API key + rich Zapier triggers; **opt-in marketplace layer** | Closest structural analog; 2-week outage Mar 2025 |
| **ZenMaid** | $19→$49/mo +seats | Zapier-only; **no calendar sync** | Cleaning-specific, simplest; feature ceiling |
| **Maidily** | $30→$100/mo, **unlimited seats** | Limited/unconfirmed API | Flat job-based pricing = best counter-positioning vs per-seat creep |
| **MaidCentral** | **$450+/mo** | Zapier/Keap only | Upmarket, deep KPI reporting; multi-location |
| **Fresha / Booksy** (beauty) | $15–30/mo + **commission** | Closed, marketplace-protective | Fresha **20% new-client fee** is the deepest grievance — *never claw back a provider's repeat clients* |

**Integration takeaway (ranked usefulness as targets):** Jobber (native GraphQL) > Housecall Pro (MAX-gated) > BookingKoala (API + Zapier) > ZenMaid/Maidily/MaidCentral (Zapier webhooks only) > Fresha/Booksy (don't bother). Realistic plan: **native connectors for Jobber + Housecall Pro; a Zapier/Make webhook bridge as the universal fallback.**

**What owners hate (our anti-positioning):** per-seat price creep, paid add-on nickel-and-diming, payment-processing margin resentment, and marketplace commissions that claw back their *own* repeat clients.

---

## 3. The aggregation pattern — how this is actually built

No serious aggregator "connects to everyone's API." They run a **hybrid of five patterns simultaneously** (proven in travel + food delivery):

- **A. Direct supplier API (async push/pull + webhooks)** — DoorDash menu ingest returns `200` only to acknowledge; the real result arrives later via webhook. Decouples submission from processing so you can absorb thousands of suppliers.
- **B. Channel-manager / middleware** — Booking.com/Expedia never integrate each hotel; they integrate the **connectivity hub** (DerbySoft ~260K hotels) that already holds supply.
- **C. POS / "supply SDK" plugin** — most restaurants connect through their POS (Toast) or aggregation middleware (Otter, Deliverect), not the marketplace API directly.
- **D. Data-mapping / normalization layer** — heterogeneous supplier catalogs normalize into one canonical taxonomy ("2-bed deep clean").
- **E. Managed onboarding + scraping fallback** — DoorDash's own team configures stores that can't integrate; Fresha onboards salons via a partner portal. When no API exists, the market builds the supply itself.

**For us:** API integration is a real but *small* accelerant (Handy partnership + cleaners who already run Jobber/Housecall Pro). **The durable supply is a managed-onboarding catalog we build ourselves**, with an async-ingestion design and a canonical service taxonomy + mapping layer — exactly how DoorDash and OTAs actually operate.

---

## 4. Payments & monetization benchmarks

- **Rails:** Stripe Connect (Express) with **destination charges** — customer pays once, Stripe routes the provider's share, we keep `application_fee_amount`. Split is **configurable per transaction** (commission can vary by provider). Escrow-style hold-until-complete via delayed transfers reduces no-show/redo disputes.
- **Cost of payments:** 2.9% + 30¢ card; +$2/mo per active connected account; 0.25%+25¢ payout; 1% instant payout; $15 dispute; ACH 0.8% capped $5. **All-in ≈ 3.5–5% of GMV.**
- **Take-rate law (a16z/Tidemark):** take rate scales with *how much of the job the marketplace does*. Pure payments <1%; vertical marketplaces 8–15%; **managed marketplaces that own matching + logistics + payments + insurance run 10–30%.** ACV Auctions grew from ~2% to >4% by stacking logistics/financing/insurance (55% of revenue).
- **Cleaning-specific:** TaskRabbit ~22% blended; cleaning lead CPL ~$30 with strong ~17.6% conversion. Stackable lines to push blended take toward 25%: **commission + provider SaaS subscription + payment markup + insurance/quality add-ons + featured listings + lead-gen fallback.**

---

## 5. Trust, safety & the premium playbook

- **Vetting cost stack (per worker):** Checkr/GoodHire background check **$30 (basic) → $55–90 (county+state+fed)**; continuous monitoring **$1.70/mo**; ID verification (Stripe Identity/Persona) **~$1.50–5**. Checkr is the gig standard (Uber, Instacart, Handy).
- **Insurance:** cleaner GL **~$44–48/mo**; janitorial bond **~$11/mo**. "Bonded" covers theft; "insured" covers damage — premium brands carry **both**.
- **The premium playbook (what budget players won't do):** hard vetting as marketing (Batmaid: "~3% pass"), **triple guarantee** (insurance + money-back + **24-hour free re-clean** — near-zero cost, huge trust lever), **same assigned pro every visit** (the #1 unmet need), concierge support, **auditable photo-verified checklists**, and **membership/recurring** (51% of homeowners now expect a service plan; subscription customers = 3–5× LTV).

---

## 6. Emerging angles (2024–2026)

1. **AI booking/dispatch** — 50% of cleaning owners already use AI; AI voice booking (Avoca, $1B valuation) recovers the 35–50% of inbound leads lost to missed calls (~15% booking lift). Strongest near-term hook.
2. **STR / Airbnb turnover** — $72B→$125B market, 8.1M listings, **recurring-by-default, calendar-synced, price-inelastic** cleaning events. The ideal high-LTV B2B beachhead (incumbents: Turno, Properly).
3. **Commercial/office** — long-term agreements = 63% of revenue; structurally locked-in retention.
4. **Green/eco** — natural-cleaning market 11.3% CAGR; consumers pay ~9.7% more for sustainable; a premium badge, not a standalone business.
5. **Dynamic pricing** — greenfield but risky; cleaning is consolidating toward *transparent* pricing — reward transparency, not surge.

---

## Sources (selected)

Handy/Angi: [FTC v. Handy](https://www.ftc.gov/system/files/ftc_gov/pdf/1-Handy-Complaint.pdf), [FTC+NYAG $2.95M](https://www.ftc.gov/news-events/news/press-releases/2025/01/ftc-new-york-attorney-general-take-action-against-handy-technologies-deceiving-workers-about), [Angi Q4'25 8-K](https://www.sec.gov/Archives/edgar/data/0001705110/000170511026000008/q42025earningsrelease.htm), [HomeAdvisor $7.2M](https://www.ftc.gov/news-events/news/press-releases/2023/01/ftc-order-requires-homeadvisor-pay-72-million-stop-deceptively-marketing-its-leads-home-improvement). TaskRabbit: [service fee](https://support.taskrabbit.com/hc/en-us/articles/46260411872155-What-s-the-Taskrabbit-Service-Fee). Thumbtack: [lead pricing](https://help.thumbtack.com/article/pay-for-leads), [$3.2B valuation](https://press.thumbtack.com/announcements/thumbtack-secures-275-million-investment-at-3-2-billion-valuation/). Urban Company: [StartupTalky model](https://startuptalky.com/urban-company-business-model/), [FY25](https://unlistedzone.com/urban-company-fy25-financial-analysis-business-model-revenue-streams-ipo-outlook). SaaS APIs: [Jobber dev center](https://help.getjobber.com/hc/en-us/articles/360062128653-App-Marketplace), [Housecall API](https://docs.housecallpro.com/docs/housecall-public-api/2dcf481ed7d69-create-a-job), [Handy Orders API](https://partners.services.handy.com/docs/orders_api), [Thumbtack API](https://developers.thumbtack.com/api-reference). Patterns: [DoorDash menu](https://developer.doordash.com/en-US/docs/marketplace/how_to/menu_integration/), [Expedia Rapid](https://partner.expediagroup.com/en-us/solutions/build-your-travel-experience/rapid-api). Payments: [Stripe Connect pricing](https://stripe.com/connect/pricing). Take rates: [a16z 13 metrics](https://a16z.com/13-metrics-for-marketplace-companies/), [Tidemark](https://www.tidemarkcap.com/vskp-chapter/marketplace-take-rates). Market size: [Fortune Business Insights](https://www.fortunebusinessinsights.com/cleaning-services-market-107295), [IBISWorld janitorial](https://www.ibisworld.com/united-states/market-size/janitorial-services/1496/), [US residential maid $17B](https://www.globenewswire.com/news-release/2026/04/16/3275153/28124/en/United-States-Residential-Maid-Services-Industry-Report-2026-The-Most-Comprehensive-Analysis-Ever-of-the-Little-Researched-17-Billion-Market.html), [Jobber cleaning trends](https://www.getjobber.com/academy/cleaning/cleaning-industry-trends/). Trust: [Checkr pricing](https://checkr.com/pricing), [Insureon cleaning](https://www.insureon.com/cleaning-business-insurance/cost).

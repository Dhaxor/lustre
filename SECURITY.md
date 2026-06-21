# Security — Stripe integration review

An adversarial multi-agent review (4 lenses: secret-leakage, payment-correctness,
webhook, API-abuse; each finding independently verified) was run against the
Stripe Connect integration. It surfaced **9 confirmed findings** — 1 high, 3
medium, 5 low. This file records what was fixed and what is intentionally
deferred to Phase 1 (auth + database).

## Fixed in Phase 0

| Sev | Finding | Fix |
|---|---|---|
| **High** | A confirmed PaymentIntent could back **multiple bookings** (no idempotency) | `BookingService.book` now reserves the PI immediately and rejects reuse with `PaymentAlreadyUsedError` → **409**; one PI → one booking. Regression-tested. |
| Med | `/api/connect/onboard` was an open factory for Connect accounts | **Closed by default**: requires `CONNECT_ONBOARD_SECRET` + `x-lustre-admin` header (else 403), rate-limited, email-validated. |
| Med | `/api/checkout` allowed unlimited PaymentIntent creation (abuse / rate-limit exhaustion) | Per-IP rate limit (10/min); `book` 20/min, `onboard` 5/min. |
| Med | Unvalidated `membershipTier` → `NaN` prices + leaked Stripe error text | `membershipTier` enum-validated → `none`; strict date validation; pricing has `?? 0` defense-in-depth. Regression-tested. |
| Low | Raw Stripe/engine error text returned to clients | Central `errorResponse()` — safe `ValidationError` messages surfaced; everything else logged server-side, returned generic. |
| Low | Webhook had no replay/idempotency dedup | In-memory `event.id` dedup added (Phase-1 → persistent store). |
| Low | `payoutToPro` omitted `source_transaction` / amount cap (dead code) | Hardened: `source_transaction` support, positive-amount guard, required source PI, caller must cap to ledger payout. |

**Always-correct (verified, no change needed):** the Stripe **secret key never
reaches the client** (`server-only` + only `NEXT_PUBLIC_` publishable key in the
browser); webhook **signature is verified** before handling; `/api/book`
**verifies the PaymentIntent server-side** (ours, USD, exact server-computed
amount, capturable) so the **price cannot be tampered**.

## Deferred to Phase 1 (need the auth + DB layer)

These are latent in a Phase-0 in-memory demo (no persistence, no real fulfillment
wired) and are tracked, not ignored:

1. **Identity is not yet authenticated.** `customerId` / `preferredProId` are
   accepted as untrusted *hints* from the body. Phase 1 must derive `customerId`
   from the session and authorize any `preferredProId` against the caller.
2. **Persistent idempotency.** Replace the in-memory PI-consumed map and webhook
   event-dedup with DB constraints (unique on `paymentIntentId`; a
   `processed_events` table unique on `event.id`, written in the same
   transaction as the state mutation).
3. **Distributed rate limiting + bot check.** The in-memory limiter is
   per-instance; Phase 1 uses a shared store (Redis/Upstash) + Turnstile/hCaptcha
   on the public entry points.
4. **Wire `payoutToPro` safely** — only from a verified-completion path, capped to
   `ledger.payoutCents`, funded by the captured charge (`source_transaction`).

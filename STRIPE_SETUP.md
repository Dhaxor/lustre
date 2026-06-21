# Stripe setup — what *you* do, what the *code* does

> **Golden rule:** never paste a secret key into a chat, a commit, or anywhere
> public. The only place your secret key goes is `lustre/web/.env.local` on your
> own machine (git-ignored). Claude builds the integration against environment
> variables and never needs to see the key.

Start in **Test mode** (toggle top-right of the Stripe Dashboard). Test keys
start `sk_test_` / `pk_test_` and move no real money. Switch to live later by
swapping in the live keys.

---

## 1. Things only you can do (in the Stripe Dashboard)

1. **Create / log into your Stripe account** → https://dashboard.stripe.com
2. **Enable Connect** (this is what lets you pay out cleaners):
   Dashboard → search **"Connect"** → **Get started** → choose **Platform/Marketplace**.
   Set the platform name to **Lustre** and add a support email + icon (this is what
   cleaners see on the onboarding screen).
3. **Get your API keys:** Dashboard → **Developers → API keys** (Test mode).
   Copy the **Publishable key** (`pk_test_…`) and **Secret key** (`sk_test_…`).
4. **Create a webhook endpoint:** Developers → **Webhooks → Add endpoint**.
   - URL: `https://YOUR_PUBLIC_URL/api/stripe/webhook`
     (for local testing use the Stripe CLI instead — see §3)
   - Events to send: `payment_intent.amount_capturable_updated`,
     `payment_intent.succeeded`, `payment_intent.canceled`, `charge.refunded`,
     `account.updated`.
   - After creating it, copy the **Signing secret** (`whsec_…`).
5. *(Optional, for live mode later)* Complete your business profile so you can
   accept real charges and send real payouts.

## 2. Put the values in `.env.local` (your machine only)

```bash
cd lustre/web
cp .env.example .env.local
```

Then edit `.env.local`:

```
STRIPE_SECRET_KEY=<paste your sk_test_… secret key>
STRIPE_WEBHOOK_SECRET=<paste your whsec_… signing secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<paste your pk_test_… publishable key>
```

Restart the dev server. With these set, the app switches from demo mode
(in-memory fake payments) to **real Stripe escrow + Connect**. With them unset,
everything still runs in demo mode.

## 3. Local webhook testing (optional but recommended)

Install the **Stripe CLI**, then:

```bash
stripe login
stripe listen --forward-to localhost:3210/api/stripe/webhook
```

The CLI prints a `whsec_…` — use that as `STRIPE_WEBHOOK_SECRET` while testing
locally. Trigger events with e.g. `stripe trigger payment_intent.succeeded`.

## 4. Test cards (Test mode only)

| Scenario | Card number |
|---|---|
| Success | `4242 4242 4242 4242` |
| Requires authentication (3DS) | `4000 0027 6000 3184` |
| Declined | `4000 0000 0000 0002` |

Any future expiry, any CVC, any ZIP.

---

## What the code already does for you (no dashboard clicks)

- **Escrow checkout:** `POST /api/checkout` creates a manual-capture
  PaymentIntent (a *hold*, not a charge) for the server-computed amount; the
  browser collects the card via Stripe Elements.
- **Verified booking:** `POST /api/book` re-checks the PaymentIntent server-side
  (ours, USD, exact amount, capturable) before confirming — blocks price tampering.
- **Capture on completion:** `BookingService.complete()` captures the hold only
  when the clean is verified.
- **Cleaner onboarding:** `POST /api/connect/onboard` creates a Connect **Express**
  account for a cleaner and returns a hosted onboarding link.
- **Payouts:** `payoutToPro()` transfers a pro's share to their connected account.
- **Webhooks:** `POST /api/stripe/webhook` verifies the signature before handling.

## Still to wire (Phase 1, needs a database)

Persisting `accountId` against each pro, recording PaymentIntent/booking links,
and the idempotent webhook reconciliation are marked `TODO Phase 1` in the code —
they need the Postgres layer from `docs/03-architecture.md`.

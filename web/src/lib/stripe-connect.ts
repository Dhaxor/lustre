import "server-only";
import type Stripe from "stripe";
import { requireStripe } from "./stripe";

// Stripe Connect helpers for the supply side (cleaners = Express connected
// accounts) and the escrow checkout. Pure server-side; never imported by client
// code. Phase-1 booking links a pro to a `connectedAccountId` produced here.

export interface OnboardingLink {
  accountId: string;
  url: string;
}

/** Create an Express connected account for a cleaner and an onboarding link. */
export async function createConnectOnboarding(params: {
  email?: string;
  returnUrl: string;
  refreshUrl: string;
  existingAccountId?: string;
}): Promise<OnboardingLink> {
  const stripe = requireStripe();
  const accountId =
    params.existingAccountId ??
    (
      await stripe.accounts.create({
        type: "express",
        email: params.email,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_type: "individual",
        metadata: { app: "lustre" },
      })
    ).id;

  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: params.returnUrl,
    refresh_url: params.refreshUrl,
  });

  return { accountId, url: link.url };
}

/**
 * Create the consumer checkout PaymentIntent (manual capture = escrow). The
 * client confirms it with a card via Stripe Elements; its id is then passed to
 * /api/book. We do NOT set transfer_data here — payouts to the pro happen as a
 * separate Transfer at settlement, after we know which pro fulfilled (separate
 * charges & transfers), which fits our match-then-book flow.
 */
export async function createCheckoutIntent(params: {
  amountCents: number;
  metadata?: Record<string, string>;
}): Promise<{ id: string; clientSecret: string }> {
  const stripe = requireStripe();
  const pi = await stripe.paymentIntents.create({
    amount: params.amountCents,
    currency: "usd",
    capture_method: "manual",
    automatic_payment_methods: { enabled: true },
    metadata: { app: "lustre", ...(params.metadata ?? {}) },
  });
  if (!pi.client_secret) throw new Error("Stripe did not return a client secret");
  return { id: pi.id, clientSecret: pi.client_secret };
}

/**
 * Settle a pro's share to their connected account after a verified completion.
 *
 * Pass `sourceChargeId` (the captured charge id of the booking's PaymentIntent)
 * so the Transfer is funded by — and capped to — that specific charge via
 * `source_transaction`, instead of drawing from the platform's general balance.
 * The caller MUST cap `amountCents` to the booking ledger's `payoutCents`.
 */
export async function payoutToPro(params: {
  connectedAccountId: string;
  amountCents: number;
  sourcePaymentIntentId: string;
  sourceChargeId?: string;
  currency?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Transfer> {
  if (!Number.isInteger(params.amountCents) || params.amountCents <= 0) {
    throw new Error("payoutToPro: amountCents must be a positive integer");
  }
  const stripe = requireStripe();
  return stripe.transfers.create({
    amount: params.amountCents,
    currency: params.currency ?? "usd",
    destination: params.connectedAccountId,
    transfer_group: params.sourcePaymentIntentId,
    ...(params.sourceChargeId ? { source_transaction: params.sourceChargeId } : {}),
    metadata: { app: "lustre", ...(params.metadata ?? {}) },
  });
}

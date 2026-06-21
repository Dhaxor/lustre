import { loadStripe, type Stripe } from "@stripe/stripe-js";

// Browser-side Stripe.js loader. Uses only the PUBLISHABLE key (safe to expose).
// Returns null when no key is configured, so the UI falls back to demo mode.
let promise: Promise<Stripe | null> | null = null;

export function getStripePromise(): Promise<Stripe | null> | null {
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!pk) return null;
  if (!promise) promise = loadStripe(pk);
  return promise;
}

export function stripeConfiguredClient(): boolean {
  return !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}

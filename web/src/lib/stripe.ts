import "server-only";
import Stripe from "stripe";

// Server-only Stripe client. Instantiated lazily so the app boots fine with no
// keys (demo mode). The secret key is read from the environment and never leaves
// the server — it is never sent to the browser or logged.

let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) {
    cached = new Stripe(key, {
      appInfo: { name: "Lustre", version: "0.1.0" },
      maxNetworkRetries: 2,
      typescript: true,
    });
  }
  return cached;
}

/** True when a Stripe secret key is configured (i.e. real payments are on). */
export function stripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/** Require a configured client or throw a clear error (for API routes). */
export function requireStripe(): Stripe {
  const s = getStripe();
  if (!s) throw new Error("Stripe is not configured (missing STRIPE_SECRET_KEY)");
  return s;
}

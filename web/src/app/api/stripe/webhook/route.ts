import { getStripe, stripeEnabled } from "@/lib/stripe";

// In-memory processed-event dedup (Phase-0). Phase 1 replaces this with a
// persistent processed_events table (unique on event.id) written in the same
// transaction as the state mutation, so redelivered events are ignored exactly.
const g = globalThis as unknown as { __lustreWebhookSeen?: Set<string> };
const seenEvents: Set<string> = g.__lustreWebhookSeen ?? (g.__lustreWebhookSeen = new Set());

// Stripe webhook receiver. The raw body + signature are verified against the
// endpoint signing secret before any handling — unsigned/forged events are
// rejected. Runs on the Node runtime (default) so we get the raw text body.
export async function POST(request: Request) {
  if (!stripeEnabled()) {
    return new Response("Stripe not configured", { status: 400 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook secret not configured", { status: 400 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const raw = await request.text();
  const stripe = getStripe()!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch {
    return new Response("Signature verification failed", { status: 400 });
  }

  // Idempotency: Stripe delivers at-least-once. Skip events we've already seen
  // so state-changing handlers (Phase 1) run exactly once per event.
  if (seenEvents.has(event.id)) {
    return Response.json({ received: true, duplicate: true });
  }
  seenEvents.add(event.id);

  switch (event.type) {
    case "payment_intent.amount_capturable_updated":
    case "payment_intent.succeeded":
    case "payment_intent.canceled":
    case "charge.refunded":
    case "account.updated":
      // Phase 1: reconcile booking/fulfillment status and pro account state in
      // the database here (idempotently, keyed on event.id).
      break;
    default:
      break;
  }

  return Response.json({ received: true });
}

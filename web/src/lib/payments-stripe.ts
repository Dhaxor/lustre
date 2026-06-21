import "server-only";
import type Stripe from "stripe";
import type {
  PaymentService,
  PaymentAuthorization,
  PaymentStatus,
} from "@/core/payments";
import { requireStripe } from "./stripe";

// Real PaymentService backed by Stripe PaymentIntents with **manual capture** —
// i.e. escrow. authorize() places a hold; capture() settles it once the clean is
// verified complete; cancel() releases it (no-show / fallback / customer cancel).
//
// In the production consumer flow the client pre-creates AND confirms the
// PaymentIntent via /api/checkout (Stripe Elements), then passes its id to
// /api/book — so the engine reuses an already-confirmed `requires_capture`
// intent rather than calling authorize() blind. authorize() is kept faithful for
// direct/server callers and parity with FakePaymentService.

function mapStatus(s: Stripe.PaymentIntent.Status): PaymentStatus {
  switch (s) {
    case "succeeded":
      return "captured";
    case "canceled":
      return "canceled";
    case "requires_capture":
      return "requires_capture";
    default:
      // requires_payment_method | requires_confirmation | requires_action |
      // processing — an open hold awaiting client-side confirmation.
      return "requires_capture";
  }
}

export class StripeConnectPaymentService implements PaymentService {
  async authorize(
    amountCents: number,
    metadata?: Record<string, string>,
  ): Promise<PaymentAuthorization> {
    const stripe = requireStripe();
    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      capture_method: "manual", // escrow hold
      automatic_payment_methods: { enabled: true },
      metadata: { app: "lustre", ...(metadata ?? {}) },
    });
    return { id: pi.id, amountCents: pi.amount, status: mapStatus(pi.status), metadata };
  }

  async capture(id: string): Promise<PaymentAuthorization> {
    const stripe = requireStripe();
    const pi = await stripe.paymentIntents.capture(id);
    return { id: pi.id, amountCents: pi.amount, status: mapStatus(pi.status) };
  }

  async cancel(id: string): Promise<PaymentAuthorization> {
    const stripe = requireStripe();
    const pi = await stripe.paymentIntents.cancel(id);
    return { id: pi.id, amountCents: pi.amount, status: mapStatus(pi.status) };
  }
}

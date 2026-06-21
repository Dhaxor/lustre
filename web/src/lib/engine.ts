import { createEngine } from "@/core";
import type { BookingService } from "@/core";
import { stripeEnabled } from "./stripe";
import { StripeConnectPaymentService } from "./payments-stripe";

// Singleton across dev hot-reloads so the in-memory engine (bookings, slot
// capacity) survives module reloads. Uses real Stripe escrow when keys are
// configured, else the in-memory FakePaymentService (demo mode).
const g = globalThis as unknown as { __lustreEngine?: BookingService };

export const engine: BookingService =
  g.__lustreEngine ??
  (g.__lustreEngine = createEngine(
    stripeEnabled() ? new StripeConnectPaymentService() : undefined,
  ));

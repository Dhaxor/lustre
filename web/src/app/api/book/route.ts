import { engine } from "@/lib/engine";
import { parseBookingRequest } from "@/lib/validate";
import { getStripe, stripeEnabled } from "@/lib/stripe";
import { errorResponse } from "@/lib/api-error";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    if (!rateLimit(`book:${clientIp(request)}`, 20, 60_000)) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const req = parseBookingRequest(body);
    const quote = engine.quote(req);

    const paymentIntentId =
      typeof body?.paymentIntentId === "string" ? body.paymentIntentId : undefined;

    // In real-payments mode, require a confirmed escrow PaymentIntent and verify
    // it server-side: it must be ours, in USD, for the exact server-computed
    // amount, and in a capturable (already-confirmed) state. This blocks price
    // tampering and reuse of arbitrary intents. (One PI → one booking is further
    // enforced idempotently inside BookingService.book.)
    if (stripeEnabled()) {
      if (!paymentIntentId) {
        return Response.json({ error: "Payment confirmation required" }, { status: 402 });
      }
      const stripe = getStripe()!;
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (
        pi.metadata?.app !== "lustre" ||
        pi.currency !== "usd" ||
        pi.amount !== quote.totalCents ||
        pi.status !== "requires_capture"
      ) {
        return Response.json({ error: "Payment verification failed" }, { status: 402 });
      }
    }

    const booking = await engine.book(
      req,
      paymentIntentId ? { paymentIntentId } : undefined,
    );
    return Response.json({ booking });
  } catch (e) {
    return errorResponse(e);
  }
}

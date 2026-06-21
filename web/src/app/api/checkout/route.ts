import { engine } from "@/lib/engine";
import { parseBookingRequest } from "@/lib/validate";
import { stripeEnabled } from "@/lib/stripe";
import { createCheckoutIntent } from "@/lib/stripe-connect";
import { errorResponse } from "@/lib/api-error";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// Creates the escrow PaymentIntent for a booking and returns its client secret
// so the browser can collect a card via Stripe Elements. The amount is computed
// SERVER-SIDE from the validated request — the client never supplies the price.
export async function POST(request: Request) {
  try {
    if (!stripeEnabled()) {
      return Response.json({ error: "Stripe is not configured" }, { status: 400 });
    }
    if (!rateLimit(`checkout:${clientIp(request)}`, 10, 60_000)) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }
    const req = parseBookingRequest(await request.json());
    const quote = engine.quote(req);
    const { id, clientSecret } = await createCheckoutIntent({
      amountCents: quote.totalCents,
      metadata: { service: req.serviceType, zip: req.home.zip, frequency: req.frequency },
    });
    return Response.json({
      clientSecret,
      paymentIntentId: id,
      amountCents: quote.totalCents,
    });
  } catch (e) {
    return errorResponse(e);
  }
}

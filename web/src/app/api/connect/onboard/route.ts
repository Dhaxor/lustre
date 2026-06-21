import { stripeEnabled } from "@/lib/stripe";
import { createConnectOnboarding } from "@/lib/stripe-connect";
import { errorResponse } from "@/lib/api-error";
import { ValidationError } from "@/lib/validate";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Creates a Stripe Connect Express account for a cleaner and returns a hosted
// onboarding link. CLOSED BY DEFAULT: until the Phase-1 pro-auth layer exists,
// this requires a server-configured admin token so it can't be driven by
// anonymous traffic into an open account factory.
export async function POST(request: Request) {
  try {
    if (!stripeEnabled()) {
      return Response.json({ error: "Stripe is not configured" }, { status: 400 });
    }

    const adminToken = process.env.CONNECT_ONBOARD_SECRET;
    if (!adminToken) {
      return Response.json(
        { error: "Onboarding is disabled (set CONNECT_ONBOARD_SECRET)" },
        { status: 403 },
      );
    }
    if (request.headers.get("x-lustre-admin") !== adminToken) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!rateLimit(`onboard:${clientIp(request)}`, 5, 60_000)) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim() : undefined;
    if (email && !EMAIL_RE.test(email)) throw new ValidationError("Invalid email");

    const origin = new URL(request.url).origin;
    const result = await createConnectOnboarding({
      email,
      existingAccountId: typeof body?.accountId === "string" ? body.accountId : undefined,
      returnUrl: `${origin}/pro/onboarded`,
      refreshUrl: `${origin}/pro/onboard`,
    });
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}

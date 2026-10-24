import { engine } from "@/lib/engine";
import { errorResponse } from "@/lib/api-error";

// Marks a booking complete and CAPTURES the held escrow PaymentIntent (money in).
// This is the second half of the escrow model: /api/checkout holds, this captures
// once the clean is verified done.
//
// Phase-0 admin gate (reuses CONNECT_ONBOARD_SECRET). Phase 1 replaces this with
// real pro/admin auth via Supabase roles, plus a photo-verified completion step
// and the Connect Transfer of the pro's payout.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = process.env.CONNECT_ONBOARD_SECRET;
    if (!admin || request.headers.get("x-lustre-admin") !== admin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const booking = engine.get(id);
    if (!booking) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }
    const completed = await engine.complete(id);
    return Response.json({
      booking: {
        id: completed.id,
        status: completed.status,
        source: completed.source,
        paymentId: completed.paymentId,
        payoutCents: completed.ledger.payoutCents,
        commissionCents: completed.ledger.commissionCents,
      },
      paymentCaptured: true,
    });
  } catch (e) {
    return errorResponse(e);
  }
}

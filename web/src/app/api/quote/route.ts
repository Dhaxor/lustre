import { engine } from "@/lib/engine";
import { parseBookingRequest } from "@/lib/validate";
import { errorResponse } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
    const req = parseBookingRequest(await request.json());
    return Response.json({ quote: engine.quote(req) });
  } catch (e) {
    return errorResponse(e);
  }
}

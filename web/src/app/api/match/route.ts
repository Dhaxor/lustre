import { engine } from "@/lib/engine";
import { parseBookingRequest } from "@/lib/validate";
import { errorResponse } from "@/lib/api-error";

export async function POST(request: Request) {
  try {
    const req = parseBookingRequest(await request.json());
    const quote = engine.quote(req);
    const matches = await engine.match(req);
    return Response.json({ quote, matches });
  } catch (e) {
    return errorResponse(e);
  }
}

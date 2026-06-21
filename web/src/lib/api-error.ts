import { ValidationError } from "./validate";
import { PaymentAlreadyUsedError } from "@/core";

// Maps a thrown error to a safe HTTP response. Known input-validation messages
// are surfaced; everything else (Stripe SDK errors, engine internals) is logged
// server-side and returned as a generic message — no third-party error text or
// internal state leaks to clients.
export function errorResponse(e: unknown): Response {
  if (e instanceof ValidationError) {
    return Response.json({ error: e.message }, { status: 400 });
  }
  if (e instanceof PaymentAlreadyUsedError) {
    return Response.json({ error: e.message }, { status: 409 });
  }
  console.error("[api]", e);
  return Response.json({ error: "Unable to process request" }, { status: 500 });
}

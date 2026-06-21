import type {
  BookingRequest,
  ServiceType,
  Frequency,
  TimeSlot,
  MembershipTier,
} from "@/core";

const SERVICES: ServiceType[] = ["standard", "deep", "move_out", "str_turnover", "commercial"];
const FREQS: Frequency[] = ["one_time", "weekly", "biweekly", "monthly"];
const SLOTS: TimeSlot[] = ["morning", "midday", "afternoon", "evening"];
const MEMBERS: MembershipTier[] = ["none", "plus", "premier"];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Thrown for bad client input — safe to surface its message to the client. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Minimal runtime guard so API routes never feed garbage to the engine.
 * NOTE: customerId / preferredProId are accepted as untrusted *hints* here; once
 * the auth layer lands (Phase 1) they must be derived from the session and
 * authorized, not trusted from the body. See docs/03-architecture.md.
 */
export function parseBookingRequest(input: unknown): BookingRequest {
  const b = input as Partial<BookingRequest>;
  if (!b || typeof b !== "object") throw new ValidationError("Invalid request body");
  if (!SERVICES.includes(b.serviceType as ServiceType)) throw new ValidationError("Invalid serviceType");
  if (!FREQS.includes(b.frequency as Frequency)) throw new ValidationError("Invalid frequency");
  if (!b.home || typeof b.home.zip !== "string") throw new ValidationError("Invalid home");
  if (
    !b.window ||
    !SLOTS.includes(b.window.slot as TimeSlot) ||
    typeof b.window.date !== "string" ||
    !DATE_RE.test(b.window.date) ||
    Number.isNaN(Date.parse(b.window.date))
  ) {
    throw new ValidationError("Invalid window");
  }

  const bedrooms = clampInt(b.home.bedrooms, 0, 12);
  const bathrooms = clampInt(b.home.bathrooms, 1, 12);
  const membershipTier: MembershipTier = MEMBERS.includes(b.membershipTier as MembershipTier)
    ? (b.membershipTier as MembershipTier)
    : "none";

  return {
    customerId: typeof b.customerId === "string" ? b.customerId.slice(0, 64) : undefined,
    home: { zip: b.home.zip.slice(0, 10), bedrooms, bathrooms },
    serviceType: b.serviceType as ServiceType,
    addOns: Array.isArray(b.addOns) ? b.addOns.filter((x) => typeof x === "string").slice(0, 12) : [],
    frequency: b.frequency as Frequency,
    window: { date: b.window.date.slice(0, 10), slot: b.window.slot as TimeSlot },
    preferredProId: typeof b.preferredProId === "string" ? b.preferredProId.slice(0, 64) : undefined,
    membershipTier,
    promoCode: typeof b.promoCode === "string" ? b.promoCode.slice(0, 24) : undefined,
  };
}

function clampInt(n: unknown, min: number, max: number): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

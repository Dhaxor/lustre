// Lightweight in-memory fixed-window rate limiter. Phase-0 abuse control for the
// Stripe-creating routes (checkout, connect/onboard). Phase 1 replaces this with
// a shared store (Redis/Upstash) + a bot check (Turnstile/hCaptcha).
//
// State is kept on globalThis so it survives dev hot-reload. It is per-instance,
// so it is NOT a substitute for a distributed limiter in production.

interface Bucket {
  count: number;
  resetAt: number;
}

const g = globalThis as unknown as { __lustreRate?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = g.__lustreRate ?? (g.__lustreRate = new Map());

/** Returns true if the action is allowed; false if the limit is exceeded. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

/** Best-effort client IP from common proxy headers. */
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

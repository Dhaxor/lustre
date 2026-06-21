import { describe, it, expect } from "vitest";
import { parseBookingRequest, ValidationError } from "../validate";

const base = {
  home: { zip: "10001", bedrooms: 2, bathrooms: 1 },
  serviceType: "standard",
  addOns: [],
  frequency: "biweekly",
  window: { date: "2026-07-06", slot: "morning" },
};

describe("parseBookingRequest", () => {
  it("accepts a valid request", () => {
    const r = parseBookingRequest(base);
    expect(r.serviceType).toBe("standard");
    expect(r.membershipTier).toBe("none");
  });

  it("coerces an unknown membershipTier to 'none' (prevents NaN pricing)", () => {
    const r = parseBookingRequest({ ...base, membershipTier: "gold" });
    expect(r.membershipTier).toBe("none");
  });

  it("rejects an invalid date instead of slicing garbage", () => {
    expect(() => parseBookingRequest({ ...base, window: { date: "not-a-date", slot: "morning" } }))
      .toThrow(ValidationError);
  });

  it("rejects an unknown serviceType", () => {
    expect(() => parseBookingRequest({ ...base, serviceType: "platinum" })).toThrow(ValidationError);
  });

  it("clamps bedrooms/bathrooms into sane bounds", () => {
    const r = parseBookingRequest({ ...base, home: { zip: "10001", bedrooms: 999, bathrooms: 0 } });
    expect(r.home.bedrooms).toBe(12);
    expect(r.home.bathrooms).toBe(1);
  });
});

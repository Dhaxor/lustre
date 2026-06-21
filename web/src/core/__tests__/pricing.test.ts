import { describe, it, expect } from 'vitest';
import { quotePrice } from '../pricing';
import type { BookingRequest } from '../types';

function req(overrides: Partial<BookingRequest> = {}): BookingRequest {
  return {
    home: { zip: '60601', bedrooms: 2, bathrooms: 1 }, // standard zone
    serviceType: 'standard',
    addOns: [],
    frequency: 'one_time',
    window: { date: '2026-07-06', slot: 'morning' },
    ...overrides,
  };
}

describe('PricingEngine', () => {
  it('computes a deterministic all-in price for a standard 2bd/1ba clean', () => {
    const q = quotePrice(req());
    // 7900 + 2*1500 + 1*1800 = 12700 subtotal; + 500 trust fee = 13200
    expect(q.serviceSubtotalCents).toBe(12700);
    expect(q.totalCents).toBe(13200);
    expect(q.estimatedDurationMins).toBe(150);
  });

  it('line items always sum exactly to the total', () => {
    const cases: BookingRequest[] = [
      req(),
      req({ frequency: 'biweekly', membershipTier: 'plus' }),
      req({
        serviceType: 'deep',
        addOns: ['inside_fridge', 'inside_oven', 'eco_products'],
        home: { zip: '10001', bedrooms: 4, bathrooms: 3 }, // metro premium zone
        frequency: 'weekly',
        membershipTier: 'premier',
        promoCode: 'SPARKLE15',
      }),
    ];
    for (const c of cases) {
      const q = quotePrice(c);
      const sum = q.lineItems.reduce((s, li) => s + li.amountCents, 0);
      expect(sum).toBe(q.totalCents);
    }
  });

  it('recurring is cheaper than one-time (drives the flywheel)', () => {
    const once = quotePrice(req({ frequency: 'one_time' })).totalCents;
    const biweekly = quotePrice(req({ frequency: 'biweekly' })).totalCents;
    const weekly = quotePrice(req({ frequency: 'weekly' })).totalCents;
    expect(biweekly).toBeLessThan(once);
    expect(weekly).toBeLessThan(biweekly);
  });

  it('membership and promos reduce the total', () => {
    const base = quotePrice(req({ frequency: 'biweekly' })).totalCents;
    const withPlus = quotePrice(req({ frequency: 'biweekly', membershipTier: 'plus' })).totalCents;
    const withPromo = quotePrice(req({ frequency: 'biweekly', promoCode: 'WELCOME10' })).totalCents;
    expect(withPlus).toBeLessThan(base);
    expect(withPromo).toBeLessThan(base);
  });

  it('metro zone increases price vs standard zone', () => {
    const standard = quotePrice(req({ home: { zip: '60601', bedrooms: 2, bathrooms: 1 } })).totalCents;
    const metro = quotePrice(req({ home: { zip: '10001', bedrooms: 2, bathrooms: 1 } })).totalCents;
    expect(metro).toBeGreaterThan(standard);
  });

  it('always exposes the trust fee as a named line (never hidden)', () => {
    const q = quotePrice(req());
    const fee = q.lineItems.find((li) => li.kind === 'fee');
    expect(fee).toBeDefined();
    expect(fee!.amountCents).toBe(500);
  });
});

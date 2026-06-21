import { describe, it, expect } from 'vitest';
import { quotePrice } from '../pricing';
import { selectOffers } from '../matching';
import { ManagedPoolAdapter } from '../supply/managed-pool';
import { ConnectedProviderAdapter } from '../supply/connected-provider';
import { LeadGenAdapter } from '../supply/leadgen';
import type { ManagedPro, ConnectedProvider } from '../supply/pros';
import type { BookingRequest, TimeSlot, Weekday } from '../types';

const everyDay = (slot: TimeSlot): Partial<Record<Weekday, TimeSlot[]>> =>
  ({ 0: [slot], 1: [slot], 2: [slot], 3: [slot], 4: [slot], 5: [slot], 6: [slot] });

function managedPro(over: Partial<ManagedPro>): ManagedPro {
  return {
    id: 'pro_a',
    name: 'A',
    rating: 4.9,
    reliability: 0.97,
    skills: ['residential'],
    coverageZips: ['*'],
    weekly: everyDay('morning'),
    maxPerSlot: 1,
    servedCustomers: [],
    certifications: [],
    bio: '',
    ...over,
  };
}

function connected(over: Partial<ConnectedProvider>): ConnectedProvider {
  return {
    id: 'cp_x',
    name: 'X Cleaning',
    software: 'jobber',
    rating: 4.5,
    reliability: 0.85,
    skills: ['residential'],
    coverageZips: ['*'],
    weekly: everyDay('morning'),
    maxPerSlot: 2,
    bio: '',
    ...over,
  };
}

function req(over: Partial<BookingRequest> = {}): BookingRequest {
  return {
    home: { zip: '60601', bedrooms: 2, bathrooms: 1 },
    serviceType: 'standard',
    addOns: [],
    frequency: 'one_time',
    window: { date: '2026-07-06', slot: 'morning' },
    ...over,
  };
}

describe('MatchingEngine', () => {
  it('ranks a managed pro above a leadgen fallback', async () => {
    const adapters = [new ManagedPoolAdapter([managedPro({})]), new LeadGenAdapter()];
    const r = req();
    const ranked = await selectOffers(r, quotePrice(r), adapters);
    expect(ranked[0].offer.source).toBe('managed');
    expect(ranked[ranked.length - 1].offer.source).toBe('leadgen');
  });

  it('weights continuity highest — preferred pro wins even with lower rating', async () => {
    const adapters = [
      new ManagedPoolAdapter([
        managedPro({ id: 'pro_pref', rating: 4.5, reliability: 0.9, servedCustomers: ['cust1'] }),
        managedPro({ id: 'pro_better', rating: 4.99, reliability: 0.99 }),
      ]),
    ];
    const r = req({ customerId: 'cust1' });
    const ranked = await selectOffers(r, quotePrice(r), adapters);
    expect(ranked[0].offer.proId).toBe('pro_pref');
    expect(ranked[0].reasons).toContain('Your preferred pro');
  });

  it('prefers managed over connected for the same slot (source preference)', async () => {
    const adapters = [
      new ManagedPoolAdapter([managedPro({})]),
      new ConnectedProviderAdapter([connected({})]),
    ];
    const r = req();
    const ranked = await selectOffers(r, quotePrice(r), adapters);
    expect(ranked[0].offer.source).toBe('managed');
    expect(ranked.some((x) => x.offer.source === 'connected')).toBe(true);
  });

  it('filters out unavailable slots (skill mismatch)', async () => {
    // A request for a turnover when the only pro does residential only.
    const adapters = [new ManagedPoolAdapter([managedPro({ skills: ['residential'] })])];
    const r = req({ serviceType: 'str_turnover' });
    const ranked = await selectOffers(r, quotePrice(r), adapters);
    expect(ranked.length).toBe(0);
  });
});

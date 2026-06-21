// ConnectedProviderAdapter — independent cleaning companies that already run
// Jobber / Housecall Pro / BookingKoala. We sync their availability via their
// single-tenant APIs and push jobs as net-new demand. Lower commission, no
// onboarding friction. External calls are stubbed here (Phase 2 wires the real
// GraphQL/REST clients) but the in-memory model is fully functional for demos.

import type { BookingRequest, PriceQuote } from '../types';
import { SERVICES, CONNECTED_PAYOUT_RATE } from '../catalog';
import {
  type SupplyAdapter,
  type SupplyOffer,
  type FulfillmentResult,
  weekdayOf,
} from './adapter';
import type { ConnectedProvider } from './pros';

export class ConnectedProviderAdapter implements SupplyAdapter {
  readonly source = 'connected' as const;
  private booked = new Map<string, number>();
  private fulfillments = new Map<string, string>();
  private seq = 0;

  constructor(private providers: ConnectedProvider[]) {}

  private covers(p: ConnectedProvider, zip: string): boolean {
    return p.coverageZips.includes('*') || p.coverageZips.includes(zip.slice(0, 3));
  }

  private slotKey(id: string, date: string, slot: string): string {
    return `${id}|${date}|${slot}`;
  }

  async getOffers(req: BookingRequest, quote: PriceQuote): Promise<SupplyOffer[]> {
    const svc = SERVICES[req.serviceType];
    const wd = weekdayOf(req.window.date);
    const offers: SupplyOffer[] = [];

    for (const p of this.providers) {
      if (!p.skills.includes(svc.requiredSkill)) continue;
      if (!this.covers(p, req.home.zip)) continue;
      const slots = p.weekly[wd as keyof typeof p.weekly] ?? [];
      if (!slots.includes(req.window.slot)) continue;

      const used = this.booked.get(this.slotKey(p.id, req.window.date, req.window.slot)) ?? 0;
      offers.push({
        offerId: `connected:${p.id}:${req.window.date}:${req.window.slot}`,
        source: 'connected',
        proId: p.id,
        proName: p.name,
        rating: p.rating,
        capacityConfidence: p.reliability,
        isPreferredPro: false,
        payoutCents: Math.round(quote.serviceSubtotalCents * CONNECTED_PAYOUT_RATE),
        slotAvailable: used < p.maxPerSlot,
        blurb: p.bio,
      });
    }
    return offers;
  }

  async book(offer: SupplyOffer, req: BookingRequest): Promise<FulfillmentResult> {
    const key = this.slotKey(offer.proId, req.window.date, req.window.slot);
    const provider = this.providers.find((p) => p.id === offer.proId);
    const used = this.booked.get(key) ?? 0;
    if (!provider || used >= provider.maxPerSlot) {
      throw new Error('Connected provider slot no longer available');
    }
    this.booked.set(key, used + 1);
    // Stubbed external push (Phase 2: Jobber GraphQL / Housecall Pro REST).
    const externalRef = `${provider.software}_job_${++this.seq}`;
    const fulfillmentId = `cff_${offer.proId}_${req.window.date}_${req.window.slot}_${used}`;
    this.fulfillments.set(fulfillmentId, key);
    return { fulfillmentId, source: 'connected', externalRef, status: 'confirmed' };
  }

  async cancel(fulfillmentId: string): Promise<void> {
    const key = this.fulfillments.get(fulfillmentId);
    if (!key) return;
    const used = this.booked.get(key) ?? 0;
    if (used > 0) this.booked.set(key, used - 1);
    this.fulfillments.delete(fulfillmentId);
  }
}

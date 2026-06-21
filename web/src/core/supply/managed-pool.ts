// ManagedPoolAdapter — our own vetted, trained, equipped cleaners.
// The core supply: highest quality, margin, and control. Fully functional
// end-to-end (the demo + the real product). In Phase 1 the in-memory store
// is swapped for Postgres behind this same interface.

import type { BookingRequest, PriceQuote } from '../types';
import { SERVICES, MANAGED_PAYOUT_RATE } from '../catalog';
import {
  type SupplyAdapter,
  type SupplyOffer,
  type FulfillmentResult,
  weekdayOf,
} from './adapter';
import type { ManagedPro } from './pros';

export class ManagedPoolAdapter implements SupplyAdapter {
  readonly source = 'managed' as const;
  private booked = new Map<string, number>(); // slotKey -> count
  private fulfillments = new Map<string, string>(); // fulfillmentId -> slotKey

  constructor(private pros: ManagedPro[]) {}

  private covers(pro: ManagedPro, zip: string): boolean {
    return pro.coverageZips.includes('*') || pro.coverageZips.includes(zip.slice(0, 3));
  }

  private slotKey(proId: string, date: string, slot: string): string {
    return `${proId}|${date}|${slot}`;
  }

  async getOffers(req: BookingRequest, quote: PriceQuote): Promise<SupplyOffer[]> {
    const svc = SERVICES[req.serviceType];
    const wd = weekdayOf(req.window.date);
    const offers: SupplyOffer[] = [];

    for (const pro of this.pros) {
      if (!pro.skills.includes(svc.requiredSkill)) continue;
      if (!this.covers(pro, req.home.zip)) continue;
      const slots = pro.weekly[wd as keyof typeof pro.weekly] ?? [];
      if (!slots.includes(req.window.slot)) continue;

      const used = this.booked.get(this.slotKey(pro.id, req.window.date, req.window.slot)) ?? 0;
      const isPreferred =
        req.preferredProId === pro.id ||
        (!!req.customerId && pro.servedCustomers.includes(req.customerId));

      offers.push({
        offerId: `managed:${pro.id}:${req.window.date}:${req.window.slot}`,
        source: 'managed',
        proId: pro.id,
        proName: pro.name,
        rating: pro.rating,
        capacityConfidence: pro.reliability,
        isPreferredPro: isPreferred,
        payoutCents: Math.round(quote.serviceSubtotalCents * MANAGED_PAYOUT_RATE),
        slotAvailable: used < pro.maxPerSlot,
        blurb: pro.bio,
      });
    }
    return offers;
  }

  async book(offer: SupplyOffer, req: BookingRequest): Promise<FulfillmentResult> {
    const key = this.slotKey(offer.proId, req.window.date, req.window.slot);
    const used = this.booked.get(key) ?? 0;
    const pro = this.pros.find((p) => p.id === offer.proId);
    if (!pro || used >= pro.maxPerSlot) {
      throw new Error('Managed slot no longer available');
    }
    this.booked.set(key, used + 1);
    const fulfillmentId = `ff_${offer.proId}_${req.window.date}_${req.window.slot}_${used}`;
    this.fulfillments.set(fulfillmentId, key);
    return { fulfillmentId, source: 'managed', status: 'confirmed' };
  }

  async cancel(fulfillmentId: string): Promise<void> {
    const key = this.fulfillments.get(fulfillmentId);
    if (!key) return;
    const used = this.booked.get(key) ?? 0;
    if (used > 0) this.booked.set(key, used - 1);
    this.fulfillments.delete(fulfillmentId);
  }
}

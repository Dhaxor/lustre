// LeadGenAdapter — last-resort fallback. Always "covers" a request (lowest
// score), so the engine never drops demand: a request we can't fulfill in
// network becomes a monetized qualified lead instead of a dead end.

import type { BookingRequest, PriceQuote } from '../types';
import {
  type SupplyAdapter,
  type SupplyOffer,
  type FulfillmentResult,
} from './adapter';

export interface Lead {
  id: string;
  zip: string;
  serviceType: string;
  date: string;
  slot: string;
}

export class LeadGenAdapter implements SupplyAdapter {
  readonly source = 'leadgen' as const;
  readonly leads: Lead[] = [];

  async getOffers(req: BookingRequest): Promise<SupplyOffer[]> {
    return [
      {
        offerId: `leadgen:${req.window.date}:${req.window.slot}`,
        source: 'leadgen',
        proId: 'leadgen',
        proName: 'Vetted partner network',
        rating: 0,
        capacityConfidence: 0.3,
        isPreferredPro: false,
        payoutCents: 0,
        slotAvailable: true,
        blurb: 'No in-network pro for this slot — routed to a vetted partner.',
      },
    ];
  }

  async book(_offer: SupplyOffer, req: BookingRequest): Promise<FulfillmentResult> {
    const id = `lead_${this.leads.length + 1}`;
    this.leads.push({
      id,
      zip: req.home.zip,
      serviceType: req.serviceType,
      date: req.window.date,
      slot: req.window.slot,
    });
    return { fulfillmentId: id, source: 'leadgen', status: 'lead_created' };
  }

  async cancel(): Promise<void> {
    // Leads are not cancelable in this model.
  }
}

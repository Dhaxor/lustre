// HandyAdapter — white-label fulfillment via the Handy Orders API, the one
// real bookable home-services API (sales-gated B2B partnership; it powers
// Walmart/Wayfair in-home services at checkout). Used only for coverage gaps.
// Disabled until the partnership flag is on. External calls stubbed (Phase 4).

import type { BookingRequest, PriceQuote } from '../types';
import { HANDY_PAYOUT_RATE } from '../catalog';
import {
  type SupplyAdapter,
  type SupplyOffer,
  type FulfillmentResult,
} from './adapter';

export class HandyAdapter implements SupplyAdapter {
  readonly source = 'handy' as const;
  private seq = 0;

  constructor(private enabled = false) {}

  async getOffers(req: BookingRequest, quote: PriceQuote): Promise<SupplyOffer[]> {
    if (!this.enabled) return [];
    // Handy returns a priced, bookable slot for the requested window.
    return [
      {
        offerId: `handy:${req.window.date}:${req.window.slot}`,
        source: 'handy',
        proId: 'handy_network',
        proName: 'Handy Partner Network',
        rating: 4.2,
        capacityConfidence: 0.7,
        isPreferredPro: false,
        payoutCents: Math.round(quote.serviceSubtotalCents * HANDY_PAYOUT_RATE),
        slotAvailable: true,
        blurb: 'Coverage via the Handy Orders API partnership.',
      },
    ];
  }

  async book(): Promise<FulfillmentResult> {
    // Stubbed: POST /orders → async webhook confirmation (status starts pending).
    const externalRef = `handy_order_${++this.seq}`;
    return {
      fulfillmentId: `hff_${this.seq}`,
      source: 'handy',
      externalRef,
      status: 'pending',
    };
  }

  async cancel(): Promise<void> {
    // Stubbed: DELETE /orders/{id}.
  }
}

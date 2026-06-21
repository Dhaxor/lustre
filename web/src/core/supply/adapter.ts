// SupplyAdapter — the heart of the aggregator.
// The matching engine never knows HOW a job is fulfilled. It asks every adapter
// for normalized offers, scores them, and books the winner through this one
// interface. New supply sources = new adapters, zero core changes.

import type { BookingRequest, PriceQuote, SupplySource } from '../types';

export interface SupplyOffer {
  offerId: string;
  source: SupplySource;
  proId: string;
  proName: string;
  rating: number; // 0..5
  capacityConfidence: number; // 0..1 — likelihood they actually show (anti-no-show)
  isPreferredPro: boolean; // continuity match
  payoutCents: number; // what the pro/provider receives
  slotAvailable: boolean;
  blurb?: string;
}

export interface FulfillmentResult {
  fulfillmentId: string;
  source: SupplySource;
  externalRef?: string; // e.g. a Handy order id or connected-provider job id
  status: 'confirmed' | 'pending' | 'lead_created';
}

export type CancelReason = 'customer' | 'pro' | 'system';

export interface SupplyAdapter {
  readonly source: SupplySource;
  /** Async, non-blocking: normalized offers this source can fulfill. */
  getOffers(req: BookingRequest, quote: PriceQuote): Promise<SupplyOffer[]>;
  /** Commit a booking against a chosen offer. Throws if no longer available. */
  book(offer: SupplyOffer, req: BookingRequest, quote: PriceQuote): Promise<FulfillmentResult>;
  cancel(fulfillmentId: string, reason: CancelReason): Promise<void>;
}

/** Parse a 'YYYY-MM-DD' date to a UTC weekday deterministically. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

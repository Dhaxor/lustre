// MatchingEngine — scores every supply offer and ranks them. Source-agnostic:
// it only sees normalized SupplyOffers. Continuity ("your cleaner, guaranteed")
// is weighted highest; reliability guards the no-show failure mode that defines
// the incumbents; source preference keeps quality + margin in-house first.

import type { BookingRequest, PriceQuote, SupplySource } from './types';
import type { SupplyAdapter, SupplyOffer } from './supply/adapter';

export interface MatchWeights {
  continuity: number;
  quality: number;
  reliability: number;
  price: number;
  source: number;
}

export const DEFAULT_WEIGHTS: MatchWeights = {
  continuity: 0.35, // highest — delivers the assigned-pro promise
  quality: 0.2,
  reliability: 0.25, // anti-no-show
  price: 0.1,
  source: 0.1,
};

const SOURCE_PREFERENCE: Record<SupplySource, number> = {
  managed: 1.0,
  connected: 0.7,
  handy: 0.4,
  leadgen: 0.0,
};

export interface RankedOffer {
  offer: SupplyOffer;
  score: number;
  reasons: string[];
}

export async function selectOffers(
  req: BookingRequest,
  quote: PriceQuote,
  adapters: SupplyAdapter[],
  weights: MatchWeights = DEFAULT_WEIGHTS,
): Promise<RankedOffer[]> {
  const collected = await Promise.all(
    adapters.map((a) => a.getOffers(req, quote).catch(() => [] as SupplyOffer[])),
  );
  const eligible = collected.flat().filter((o) => o.slotAvailable);

  return eligible
    .map((offer) => {
      // Higher retained margin (lower payout share) scores slightly better.
      const priceComp = clamp01(1 - offer.payoutCents / Math.max(1, quote.totalCents));
      const score =
        weights.continuity * (offer.isPreferredPro ? 1 : 0) +
        weights.quality * (offer.rating / 5) +
        weights.reliability * offer.capacityConfidence +
        weights.price * priceComp +
        weights.source * SOURCE_PREFERENCE[offer.source];

      const reasons: string[] = [];
      if (offer.isPreferredPro) reasons.push('Your preferred pro');
      if (offer.source === 'managed') reasons.push('Lustre-vetted pro');
      if (offer.rating >= 4.8) reasons.push('Top-rated');
      if (offer.capacityConfidence >= 0.9) reasons.push('High reliability');
      if (offer.source === 'connected') reasons.push('Trusted local partner');

      return { offer, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

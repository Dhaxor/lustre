// PricingEngine — transparent, all-in, line-item pricing.
// Guarantees: every component is an itemized line; the line items always sum
// exactly to totalCents; no surge/dynamic pricing.

import type { BookingRequest, PriceQuote, PriceLineItem } from './types';
import {
  SERVICES,
  ADDONS,
  FREQUENCY_DISCOUNT,
  FREQUENCY_LABEL,
  MEMBERSHIP_DISCOUNT,
  MEMBERSHIP_LABEL,
  TRUST_FEE_CENTS,
  PROMOS,
  zoneFor,
} from './catalog';

export function quotePrice(req: BookingRequest): PriceQuote {
  const svc = SERVICES[req.serviceType];
  const lineItems: PriceLineItem[] = [];

  // 1. Base service (size-adjusted)
  const baseCents =
    svc.baseCents +
    req.home.bedrooms * svc.perBedroomCents +
    req.home.bathrooms * svc.perBathroomCents;
  lineItems.push({
    label: `${svc.name} · ${req.home.bedrooms} bd / ${req.home.bathrooms} ba`,
    amountCents: baseCents,
    kind: 'base',
  });

  let durationMins =
    svc.baseDurationMins +
    (req.home.bedrooms + req.home.bathrooms) * svc.perRoomDurationMins;

  // 2. Add-ons
  let addOnsCents = 0;
  for (const key of req.addOns) {
    const a = ADDONS[key];
    if (!a) continue;
    addOnsCents += a.cents;
    durationMins += a.durationMins;
    lineItems.push({ label: a.name, amountCents: a.cents, kind: 'addon' });
  }

  const preAdjust = baseCents + addOnsCents;

  // 3. Zone adjustment (static, disclosed — not surge)
  const zone = zoneFor(req.home.zip);
  const zoneCents = Math.round(preAdjust * (zone.multiplier - 1));
  if (zoneCents !== 0) {
    lineItems.push({ label: zone.label, amountCents: zoneCents, kind: 'adjustment' });
  }
  const afterZone = preAdjust + zoneCents;

  // 4. Frequency (recurring = cheaper)
  const freqCents = Math.round(afterZone * FREQUENCY_DISCOUNT[req.frequency]);
  if (freqCents !== 0) {
    lineItems.push({
      label: `${FREQUENCY_LABEL[req.frequency]} plan savings`,
      amountCents: freqCents,
      kind: 'discount',
    });
  }
  const afterFreq = afterZone + freqCents;

  // 5. Membership (defense-in-depth: unknown tier coalesces to 0, never NaN)
  const tier = req.membershipTier ?? 'none';
  const memCents = Math.round(afterFreq * (MEMBERSHIP_DISCOUNT[tier] ?? 0));
  if (memCents !== 0) {
    lineItems.push({
      label: `${MEMBERSHIP_LABEL[tier] ?? ''}member discount`,
      amountCents: memCents,
      kind: 'discount',
    });
  }
  const afterMem = afterFreq + memCents;

  // 6. Promo
  let promoCents = 0;
  const promoRate = req.promoCode ? PROMOS[req.promoCode.toUpperCase()] : undefined;
  if (promoRate) {
    promoCents = Math.round(afterMem * promoRate);
    lineItems.push({
      label: `Promo ${req.promoCode!.toUpperCase()}`,
      amountCents: promoCents,
      kind: 'discount',
    });
  }

  const serviceSubtotalCents = afterMem + promoCents;

  // 7. Trust & protection (the only fee — named, never hidden)
  lineItems.push({
    label: 'Trust & Protection (insurance + re-clean guarantee)',
    amountCents: TRUST_FEE_CENTS,
    kind: 'fee',
  });

  const totalCents = serviceSubtotalCents + TRUST_FEE_CENTS;

  return {
    serviceType: req.serviceType,
    lineItems,
    serviceSubtotalCents,
    totalCents,
    currency: 'usd',
    estimatedDurationMins: durationMins,
  };
}

export function formatUsd(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}

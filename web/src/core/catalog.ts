// Pricing catalog & marketplace economics config.
// Every number here is intentionally transparent — it maps 1:1 to a line item
// the customer sees before paying (the anti-incumbent "no surprise fees" promise).

import type {
  ServiceType,
  Frequency,
  MembershipTier,
  SupplySource,
} from './types';

export interface ServiceDef {
  type: ServiceType;
  name: string;
  blurb: string;
  baseCents: number;
  perBedroomCents: number;
  perBathroomCents: number;
  baseDurationMins: number;
  perRoomDurationMins: number;
  requiredSkill: string;
}

export const SERVICES: Record<ServiceType, ServiceDef> = {
  standard: {
    type: 'standard',
    name: 'Standard Clean',
    blurb: 'A thorough recurring clean that keeps your home effortless.',
    baseCents: 7900,
    perBedroomCents: 1500,
    perBathroomCents: 1800,
    baseDurationMins: 90,
    perRoomDurationMins: 20,
    requiredSkill: 'residential',
  },
  deep: {
    type: 'deep',
    name: 'Deep Clean',
    blurb: 'A top-to-bottom reset — baseboards, build-up, the works.',
    baseCents: 13900,
    perBedroomCents: 2200,
    perBathroomCents: 2600,
    baseDurationMins: 150,
    perRoomDurationMins: 30,
    requiredSkill: 'residential',
  },
  move_out: {
    type: 'move_out',
    name: 'Move-Out Clean',
    blurb: 'A deposit-back, white-glove clean for empty homes.',
    baseCents: 18900,
    perBedroomCents: 2500,
    perBathroomCents: 3000,
    baseDurationMins: 180,
    perRoomDurationMins: 30,
    requiredSkill: 'residential',
  },
  str_turnover: {
    type: 'str_turnover',
    name: 'Airbnb Turnover',
    blurb: 'Calendar-synced, photo-verified turnovers between guests.',
    baseCents: 8900,
    perBedroomCents: 1400,
    perBathroomCents: 1700,
    baseDurationMins: 75,
    perRoomDurationMins: 15,
    requiredSkill: 'turnover',
  },
  commercial: {
    type: 'commercial',
    name: 'Office / Commercial',
    blurb: 'Reliable contract cleaning for workspaces.',
    baseCents: 16900,
    perBedroomCents: 0,
    perBathroomCents: 2200,
    baseDurationMins: 120,
    perRoomDurationMins: 0,
    requiredSkill: 'commercial',
  },
};

export interface AddOnDef {
  key: string;
  name: string;
  cents: number;
  durationMins: number;
}

export const ADDONS: Record<string, AddOnDef> = {
  inside_fridge: { key: 'inside_fridge', name: 'Inside Fridge', cents: 2500, durationMins: 25 },
  inside_oven: { key: 'inside_oven', name: 'Inside Oven', cents: 2500, durationMins: 25 },
  interior_windows: { key: 'interior_windows', name: 'Interior Windows', cents: 3500, durationMins: 35 },
  laundry: { key: 'laundry', name: 'Laundry & Linens', cents: 2000, durationMins: 30 },
  inside_cabinets: { key: 'inside_cabinets', name: 'Inside Cabinets', cents: 3000, durationMins: 30 },
  eco_products: { key: 'eco_products', name: 'Eco / Non-Toxic Products', cents: 1500, durationMins: 0 },
  pet_home: { key: 'pet_home', name: 'Pet-Friendly Detail', cents: 1500, durationMins: 15 },
};

/** Recurring is *cheaper* — this drives the recurring-revenue flywheel. */
export const FREQUENCY_DISCOUNT: Record<Frequency, number> = {
  one_time: 0,
  weekly: -0.15,
  biweekly: -0.1,
  monthly: -0.05,
};

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  one_time: 'One-time',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
};

export const MEMBERSHIP_DISCOUNT: Record<MembershipTier, number> = {
  none: 0,
  plus: -0.1,
  premier: -0.15,
};

export const MEMBERSHIP_LABEL: Record<MembershipTier, string> = {
  none: '',
  plus: 'Lustre+ ',
  premier: 'Lustre Premier ',
};

/** The single named "fee" — funds insurance, 24/7 support, and the re-clean guarantee. */
export const TRUST_FEE_CENTS = 500;

interface ZoneTier {
  prefixes: string[]; // 3-digit zip prefixes
  label: string;
  multiplier: number;
}

// Static cost-of-living tiers — NOT surge pricing. Research: cleaning rewards
// transparency over dynamic pricing, so zones are fixed and disclosed.
const ZONE_TIERS: ZoneTier[] = [
  {
    prefixes: ['100', '101', '104', '070', '021', '941', '900', '981'],
    label: 'Metro premium zone',
    multiplier: 1.12,
  },
];

export function zoneFor(zip: string): { label: string; multiplier: number } {
  const prefix = zip.slice(0, 3);
  for (const tier of ZONE_TIERS) {
    if (tier.prefixes.includes(prefix)) {
      return { label: tier.label, multiplier: tier.multiplier };
    }
  }
  return { label: 'Standard zone', multiplier: 1.0 };
}

export const PROMOS: Record<string, number> = {
  SPARKLE15: -0.15,
  WELCOME10: -0.1,
};

// --- Marketplace economics (see docs/02-strategy-and-monetization.md) ---

/** Commission taken on the service subtotal, by supply source. */
export const COMMISSION_RATE: Record<SupplySource, number> = {
  managed: 0.2, // cleaner keeps 80%
  connected: 0.11, // they bring their own supply/ops; we bring net-new demand
  handy: 0.15,
  leadgen: 0, // monetized as a flat lead fee instead
};

export const MANAGED_PAYOUT_RATE = 1 - COMMISSION_RATE.managed; // 0.80
export const CONNECTED_PAYOUT_RATE = 1 - COMMISSION_RATE.connected; // 0.89
export const HANDY_PAYOUT_RATE = 1 - COMMISSION_RATE.handy; // 0.85

/** Blended Stripe Connect cost as a fraction of GMV (3.5–5% range). */
export const STRIPE_RATE = 0.039;

/** Per-job reserve funding the satisfaction / re-clean guarantee. */
export const GUARANTEE_RESERVE_CENTS = 200;

/** Flat fee captured when an unfulfillable request is monetized as a qualified lead. */
export const LEADGEN_FEE_CENTS = 1800;

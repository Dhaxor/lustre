// Lustre domain types — pure, framework-agnostic. Shared across web/api/workers.

export type ServiceType =
  | 'standard'
  | 'deep'
  | 'move_out'
  | 'str_turnover'
  | 'commercial';

export type Frequency = 'one_time' | 'weekly' | 'biweekly' | 'monthly';

export type SupplySource = 'managed' | 'connected' | 'handy' | 'leadgen';

export type TimeSlot = 'morning' | 'midday' | 'afternoon' | 'evening';

export type MembershipTier = 'none' | 'plus' | 'premier';

/** 0 = Sunday … 6 = Saturday (matches Date.getUTCDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface HomeProfile {
  zip: string;
  bedrooms: number;
  bathrooms: number;
  sqft?: number;
}

export interface TimeWindow {
  date: string; // 'YYYY-MM-DD'
  slot: TimeSlot;
}

export interface BookingRequest {
  customerId?: string;
  home: HomeProfile;
  serviceType: ServiceType;
  addOns: string[]; // AddOn keys
  frequency: Frequency;
  window: TimeWindow;
  preferredProId?: string; // continuity: "your cleaner, guaranteed"
  membershipTier?: MembershipTier;
  promoCode?: string;
}

export type PriceLineKind = 'base' | 'addon' | 'adjustment' | 'fee' | 'discount';

export interface PriceLineItem {
  label: string;
  amountCents: number; // signed; discounts are negative
  kind: PriceLineKind;
}

export interface PriceQuote {
  serviceType: ServiceType;
  lineItems: PriceLineItem[];
  /** Everything except the trust fee — the basis for commission & payout. */
  serviceSubtotalCents: number;
  totalCents: number;
  currency: 'usd';
  estimatedDurationMins: number;
}

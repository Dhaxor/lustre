// Seed supply for the local demo / Phase 0. In Phase 1 this is backed by
// Postgres (vetted-pro onboarding + a live availability projection).

import type { TimeSlot, Weekday } from '../types';

export interface ManagedPro {
  id: string;
  name: string;
  rating: number; // 0..5
  reliability: number; // 0..1 -> capacityConfidence
  skills: string[]; // 'residential' | 'turnover' | 'commercial'
  coverageZips: string[]; // 3-digit prefixes, or '*' for everywhere
  weekly: Partial<Record<Weekday, TimeSlot[]>>;
  maxPerSlot: number;
  servedCustomers: string[]; // continuity history
  certifications: string[];
  bio: string;
}

const ALL = '*';

// A small, dense launch roster. Coverage '*' keeps the demo robust for any zip;
// varied weekly schedules mean some slots fall through to connected/leadgen,
// which is exactly the fallback behavior we want to demonstrate.
export const MANAGED_PROS: ManagedPro[] = [
  {
    id: 'pro_amara',
    name: 'Amara O.',
    rating: 4.95,
    reliability: 0.98,
    skills: ['residential', 'turnover'],
    coverageZips: [ALL],
    weekly: { 1: ['morning', 'midday'], 2: ['morning', 'midday'], 3: ['morning', 'midday'], 4: ['morning', 'midday'], 5: ['morning'] },
    maxPerSlot: 1,
    servedCustomers: ['cust_demo'],
    certifications: ['Background-checked', 'Lustre Academy Certified', 'Eco-Certified'],
    bio: 'Detail-obsessed lead cleaner. 1,200+ five-star cleans. Eco-product specialist.',
  },
  {
    id: 'pro_diego',
    name: 'Diego R.',
    rating: 4.88,
    reliability: 0.95,
    skills: ['residential', 'commercial'],
    coverageZips: [ALL],
    weekly: { 1: ['afternoon', 'evening'], 2: ['afternoon', 'evening'], 3: ['afternoon'], 4: ['afternoon', 'evening'], 6: ['morning', 'midday'] },
    maxPerSlot: 1,
    servedCustomers: [],
    certifications: ['Background-checked', 'Lustre Academy Certified', 'Insured & Bonded'],
    bio: 'Move-out and office specialist. Fast, thorough, and unflappable.',
  },
  {
    id: 'pro_mei',
    name: 'Mei L.',
    rating: 4.92,
    reliability: 0.97,
    skills: ['residential', 'turnover'],
    coverageZips: [ALL],
    weekly: { 0: ['morning', 'midday'], 3: ['midday', 'afternoon'], 4: ['midday'], 5: ['morning', 'midday', 'afternoon'], 6: ['morning', 'midday'] },
    maxPerSlot: 1,
    servedCustomers: [],
    certifications: ['Background-checked', 'Lustre Academy Certified', 'Pet-Friendly Certified'],
    bio: 'Recurring-clean favorite. Known for leaving homes hotel-grade.',
  },
  {
    id: 'pro_sana',
    name: 'Sana K.',
    rating: 4.81,
    reliability: 0.93,
    skills: ['residential', 'turnover', 'commercial'],
    coverageZips: [ALL],
    weekly: { 0: ['afternoon', 'evening'], 1: ['evening'], 5: ['afternoon', 'evening'], 6: ['afternoon', 'evening'] },
    maxPerSlot: 1,
    servedCustomers: [],
    certifications: ['Background-checked', 'Lustre Academy Certified'],
    bio: 'Evenings and weekends. Great with Airbnb turnovers on tight timelines.',
  },
];

export interface ConnectedProvider {
  id: string;
  name: string; // the independent cleaning company
  software: 'jobber' | 'housecall_pro' | 'bookingkoala';
  rating: number;
  reliability: number;
  skills: string[];
  coverageZips: string[];
  weekly: Partial<Record<Weekday, TimeSlot[]>>;
  maxPerSlot: number;
  bio: string;
}

// Independent companies already running back-office software — we sync their
// availability and route them net-new demand (lower commission, no rip-and-replace).
export const CONNECTED_PROVIDERS: ConnectedProvider[] = [
  {
    id: 'cp_brightnest',
    name: 'BrightNest Cleaning Co.',
    software: 'jobber',
    rating: 4.6,
    reliability: 0.85,
    skills: ['residential', 'turnover', 'commercial'],
    coverageZips: [ALL],
    weekly: { 0: ['morning', 'midday', 'afternoon', 'evening'], 1: ['morning', 'midday', 'afternoon', 'evening'], 2: ['morning', 'midday', 'afternoon', 'evening'], 3: ['morning', 'midday', 'afternoon', 'evening'], 4: ['morning', 'midday', 'afternoon', 'evening'], 5: ['morning', 'midday', 'afternoon', 'evening'], 6: ['morning', 'midday', 'afternoon', 'evening'] },
    maxPerSlot: 3,
    bio: 'A 9-person team syncing via Jobber. Broad availability, solid ratings.',
  },
  {
    id: 'cp_tidalclean',
    name: 'Tidal Clean LLC',
    software: 'housecall_pro',
    rating: 4.45,
    reliability: 0.82,
    skills: ['residential', 'commercial'],
    coverageZips: [ALL],
    weekly: { 1: ['morning', 'midday', 'afternoon'], 2: ['morning', 'midday', 'afternoon'], 3: ['morning', 'midday', 'afternoon'], 4: ['morning', 'midday', 'afternoon'], 5: ['morning', 'midday', 'afternoon'] },
    maxPerSlot: 2,
    bio: 'Housecall Pro shop, weekday coverage. Great for commercial overflow.',
  },
];

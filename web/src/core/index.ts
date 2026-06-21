// Public surface of the Lustre domain core + a wired engine factory.

export * from './types';
export * from './catalog';
export { quotePrice, formatUsd } from './pricing';
export { selectOffers, DEFAULT_WEIGHTS } from './matching';
export type { RankedOffer, MatchWeights } from './matching';
export {
  BookingService,
  computeLedger,
  PaymentAlreadyUsedError,
  type Booking,
  type BookingStatus,
  type LedgerEntry,
} from './booking-service';
export { FakePaymentService, type PaymentService } from './payments';
export type { SupplyAdapter, SupplyOffer, FulfillmentResult } from './supply/adapter';

import { BookingService } from './booking-service';
import { FakePaymentService, type PaymentService } from './payments';
import { ManagedPoolAdapter } from './supply/managed-pool';
import { ConnectedProviderAdapter } from './supply/connected-provider';
import { HandyAdapter } from './supply/handy';
import { LeadGenAdapter } from './supply/leadgen';
import { MANAGED_PROS, CONNECTED_PROVIDERS } from './supply/pros';

/** Build a fully-wired engine with seed supply. Source preference handled by
 *  the matching engine, not adapter order, but we list them most→least preferred.
 *  Pass a PaymentService to use real Stripe escrow; defaults to the in-memory
 *  FakePaymentService (demo mode). */
export function createEngine(payments: PaymentService = new FakePaymentService()): BookingService {
  const adapters = [
    new ManagedPoolAdapter(MANAGED_PROS),
    new ConnectedProviderAdapter(CONNECTED_PROVIDERS),
    new HandyAdapter(false), // partnership flag off until BD closes it
    new LeadGenAdapter(),
  ];
  return new BookingService(adapters, payments);
}

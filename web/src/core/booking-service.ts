// BookingService — orchestrates the booking lifecycle:
//   quote → match → authorize (escrow hold) → book top offer (with fallback)
//   → ledger. Completion captures the held payment.
// The fallback loop is the "backup auto-dispatch" reliability guarantee: if the
// top pro's slot vanished between match and book, we automatically try the next.

import type { BookingRequest, PriceQuote, SupplySource } from './types';
import {
  COMMISSION_RATE,
  GUARANTEE_RESERVE_CENTS,
  LEADGEN_FEE_CENTS,
  STRIPE_RATE,
  TRUST_FEE_CENTS,
} from './catalog';
import { quotePrice } from './pricing';
import { selectOffers, type RankedOffer } from './matching';
import type { PaymentService } from './payments';
import type { SupplyAdapter, SupplyOffer, FulfillmentResult } from './supply/adapter';

export type BookingStatus =
  | 'booked'
  | 'in_progress'
  | 'completed'
  | 'verified'
  | 'settled'
  | 'canceled'
  | 'reclean_requested';

export interface LedgerEntry {
  grossCents: number;
  payoutCents: number; // to the pro/provider
  commissionCents: number; // Lustre commission (or lead fee)
  trustFeeCents: number;
  paymentFeesCents: number; // Stripe
  reserveCents: number; // guarantee reserve
  contributionCents: number; // Lustre net contribution per job
}

export interface Booking {
  id: string;
  request: BookingRequest;
  quote: PriceQuote;
  offer: SupplyOffer;
  source: SupplySource;
  fulfillment: FulfillmentResult;
  paymentId: string;
  status: BookingStatus;
  ledger: LedgerEntry;
}

export function computeLedger(quote: PriceQuote, source: SupplySource): LedgerEntry {
  const gross = quote.totalCents;
  const serviceSubtotal = quote.serviceSubtotalCents;
  const commission =
    source === 'leadgen'
      ? LEADGEN_FEE_CENTS
      : Math.round(serviceSubtotal * COMMISSION_RATE[source]);
  const payout = source === 'leadgen' ? 0 : serviceSubtotal - commission;
  const paymentFees = Math.round(gross * STRIPE_RATE);
  const reserve = GUARANTEE_RESERVE_CENTS;
  const contribution = commission + TRUST_FEE_CENTS - paymentFees - reserve;
  return {
    grossCents: gross,
    payoutCents: payout,
    commissionCents: commission,
    trustFeeCents: TRUST_FEE_CENTS,
    paymentFeesCents: paymentFees,
    reserveCents: reserve,
    contributionCents: contribution,
  };
}

/** Thrown when a PaymentIntent that already backs a booking is reused. */
export class PaymentAlreadyUsedError extends Error {
  constructor() {
    super('This payment has already been used for a booking');
    this.name = 'PaymentAlreadyUsedError';
  }
}

export class BookingService {
  private bookings = new Map<string, Booking>();
  // Idempotency index: one escrow PaymentIntent backs exactly one booking.
  // Value is 'pending' while a booking is in flight, then the booking id.
  private consumedPaymentIntents = new Map<string, string>();
  private seq = 0;

  constructor(
    private adapters: SupplyAdapter[],
    private payments: PaymentService,
  ) {}

  quote(req: BookingRequest): PriceQuote {
    return quotePrice(req);
  }

  async match(req: BookingRequest): Promise<RankedOffer[]> {
    return selectOffers(req, quotePrice(req), this.adapters);
  }

  async book(req: BookingRequest, opts?: { paymentIntentId?: string }): Promise<Booking> {
    // When the client already created + confirmed an escrow PaymentIntent
    // (real Stripe checkout), reuse it across fallback attempts instead of
    // creating a fresh hold per attempt. The PI amount equals the quote total
    // regardless of which offer ultimately fulfills.
    const externalPaymentId = opts?.paymentIntentId;

    // Idempotency: reserve the PI immediately so a replayed/concurrent request
    // can never bind a second booking to the same hold (one PI → one booking).
    if (externalPaymentId) {
      if (this.consumedPaymentIntents.has(externalPaymentId)) {
        throw new PaymentAlreadyUsedError();
      }
      this.consumedPaymentIntents.set(externalPaymentId, 'pending');
    }

    try {
      const quote = quotePrice(req);
      const ranked = await selectOffers(req, quote, this.adapters);
      if (ranked.length === 0) throw new Error('No supply available for this request');

      let lastErr: unknown;
      for (const { offer } of ranked) {
        const adapter = this.adapters.find((a) => a.source === offer.source);
        if (!adapter) continue;
        const paymentId =
          externalPaymentId ??
          (await this.payments.authorize(quote.totalCents, { service: req.serviceType })).id;
        try {
          const fulfillment = await adapter.book(offer, req, quote);
          const booking: Booking = {
            id: `bk_${++this.seq}`,
            request: req,
            quote,
            offer,
            source: offer.source,
            fulfillment,
            paymentId,
            status: 'booked',
            ledger: computeLedger(quote, offer.source),
          };
          this.bookings.set(booking.id, booking);
          if (externalPaymentId) this.consumedPaymentIntents.set(externalPaymentId, booking.id);
          return booking;
        } catch (err) {
          // Slot vanished — fall through to the next offer. Only release a hold
          // we created ourselves; a client-owned PI is reused for the next try.
          if (!externalPaymentId) await this.payments.cancel(paymentId);
          lastErr = err;
        }
      }
      throw lastErr ?? new Error('Booking failed across all offers');
    } catch (err) {
      // Booking didn't complete — release the reservation so the PI can be
      // legitimately retried. (Already-consumed PIs threw above, before this.)
      if (externalPaymentId && this.consumedPaymentIntents.get(externalPaymentId) === 'pending') {
        this.consumedPaymentIntents.delete(externalPaymentId);
      }
      throw err;
    }
  }

  /** Capture the held payment once the clean is verified complete. */
  async complete(bookingId: string): Promise<Booking> {
    const b = this.bookings.get(bookingId);
    if (!b) throw new Error(`No booking ${bookingId}`);
    await this.payments.capture(b.paymentId);
    b.status = 'completed';
    return b;
  }

  get(id: string): Booking | undefined {
    return this.bookings.get(id);
  }

  list(): Booking[] {
    return [...this.bookings.values()];
  }
}

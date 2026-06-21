import { describe, it, expect } from 'vitest';
import { BookingService, computeLedger, PaymentAlreadyUsedError } from '../booking-service';
import { FakePaymentService } from '../payments';
import { quotePrice } from '../pricing';
import { ManagedPoolAdapter } from '../supply/managed-pool';
import { ConnectedProviderAdapter } from '../supply/connected-provider';
import { LeadGenAdapter } from '../supply/leadgen';
import { LEADGEN_FEE_CENTS } from '../catalog';
import type { ManagedPro, ConnectedProvider } from '../supply/pros';
import type { BookingRequest, TimeSlot, Weekday } from '../types';

const everyDay = (slot: TimeSlot): Partial<Record<Weekday, TimeSlot[]>> =>
  ({ 0: [slot], 1: [slot], 2: [slot], 3: [slot], 4: [slot], 5: [slot], 6: [slot] });

const pro: ManagedPro = {
  id: 'pro_a', name: 'Amara', rating: 4.95, reliability: 0.98, skills: ['residential'],
  coverageZips: ['*'], weekly: everyDay('morning'), maxPerSlot: 1, servedCustomers: [],
  certifications: [], bio: '',
};
const cp: ConnectedProvider = {
  id: 'cp_x', name: 'X Cleaning', software: 'jobber', rating: 4.5, reliability: 0.85,
  skills: ['residential'], coverageZips: ['*'], weekly: everyDay('morning'), maxPerSlot: 2, bio: '',
};

// standard 2bd/2ba one-time → 7900 + 2*1500 + 2*1800 = 14500 subtotal; total 15000.
function req(over: Partial<BookingRequest> = {}): BookingRequest {
  return {
    home: { zip: '60601', bedrooms: 2, bathrooms: 2 },
    serviceType: 'standard',
    addOns: [],
    frequency: 'one_time',
    window: { date: '2026-07-06', slot: 'morning' },
    ...over,
  };
}

describe('BookingService', () => {
  it('books the top-ranked managed pro and holds (not captures) payment', async () => {
    const payments = new FakePaymentService();
    const svc = new BookingService(
      [new ManagedPoolAdapter([pro]), new LeadGenAdapter()],
      payments,
    );
    const b = await svc.book(req());
    expect(b.source).toBe('managed');
    expect(b.status).toBe('booked');
    // Escrow: held, not captured.
    expect(payments.peek(b.paymentId)!.status).toBe('requires_capture');

    const done = await svc.complete(b.id);
    expect(done.status).toBe('completed');
    expect(payments.peek(b.paymentId)!.status).toBe('captured');
  });

  it('ledger matches the documented unit economics for a $150 job', async () => {
    const ledger = computeLedger(quotePrice(req()), 'managed');
    expect(ledger.grossCents).toBe(15000);
    expect(ledger.commissionCents).toBe(2900); // 20% of 14500
    expect(ledger.payoutCents).toBe(11600); // cleaner keeps 80%
    expect(ledger.paymentFeesCents).toBe(585); // 3.9% of 15000
    expect(ledger.contributionCents).toBe(2615); // $26.15 (matches docs)
  });

  it('auto-falls-back to a connected provider when the managed slot is taken', async () => {
    const svc = new BookingService(
      [new ManagedPoolAdapter([pro]), new ConnectedProviderAdapter([cp]), new LeadGenAdapter()],
      new FakePaymentService(),
    );
    const first = await svc.book(req());
    const second = await svc.book(req()); // same slot, managed pro now full
    expect(first.source).toBe('managed');
    expect(second.source).toBe('connected');
  });

  it('rejects reusing the same PaymentIntent for a second booking (idempotency)', async () => {
    const svc = new BookingService(
      [new ManagedPoolAdapter([pro]), new ConnectedProviderAdapter([cp]), new LeadGenAdapter()],
      new FakePaymentService(),
    );
    const first = await svc.book(req(), { paymentIntentId: 'pi_reuse' });
    expect(first.paymentId).toBe('pi_reuse');
    await expect(svc.book(req(), { paymentIntentId: 'pi_reuse' })).rejects.toBeInstanceOf(
      PaymentAlreadyUsedError,
    );
    // A failed booking must release the reservation so the PI can be retried.
    const empty = new BookingService([], new FakePaymentService());
    await expect(empty.book(req(), { paymentIntentId: 'pi_retry' })).rejects.toThrow();
    await expect(empty.book(req(), { paymentIntentId: 'pi_retry' })).rejects.not.toBeInstanceOf(
      PaymentAlreadyUsedError,
    );
  });

  it('falls back to a monetized lead when nothing is in-network', async () => {
    const svc = new BookingService([new LeadGenAdapter()], new FakePaymentService());
    const b = await svc.book(req());
    expect(b.source).toBe('leadgen');
    expect(b.fulfillment.status).toBe('lead_created');
    expect(b.ledger.commissionCents).toBe(LEADGEN_FEE_CENTS);
    expect(b.ledger.payoutCents).toBe(0);
  });
});

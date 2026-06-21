// PaymentService — provider-agnostic interface over Stripe Connect.
// The domain core never imports Stripe directly, so it stays fully testable
// offline. Real impl (StripeConnectPaymentService) slots in behind this in
// Phase 1; FakePaymentService powers tests + the local demo.
//
// Escrow-by-design: authorize (hold) on booking → capture on verified
// completion → transfer to the pro after the guarantee window. This protects
// against no-shows and funds the re-clean guarantee.

export type PaymentStatus = 'requires_capture' | 'captured' | 'canceled';

export interface PaymentAuthorization {
  id: string;
  amountCents: number;
  status: PaymentStatus;
  metadata?: Record<string, string>;
}

export interface PaymentService {
  /** Place a hold (auth) for the full all-in price. */
  authorize(amountCents: number, metadata?: Record<string, string>): Promise<PaymentAuthorization>;
  /** Capture a held auth once the clean is verified complete. */
  capture(id: string): Promise<PaymentAuthorization>;
  /** Release a hold (no-show, fallback, customer cancel inside window). */
  cancel(id: string): Promise<PaymentAuthorization>;
}

/** In-memory implementation. Deterministic ids (no Date/random) for stable tests. */
export class FakePaymentService implements PaymentService {
  private store = new Map<string, PaymentAuthorization>();
  private seq = 0;

  async authorize(
    amountCents: number,
    metadata?: Record<string, string>,
  ): Promise<PaymentAuthorization> {
    const id = `pi_fake_${++this.seq}`;
    const auth: PaymentAuthorization = {
      id,
      amountCents,
      status: 'requires_capture',
      metadata,
    };
    this.store.set(id, auth);
    return { ...auth };
  }

  async capture(id: string): Promise<PaymentAuthorization> {
    const auth = this.store.get(id);
    if (!auth) throw new Error(`No authorization ${id}`);
    if (auth.status === 'canceled') throw new Error(`Authorization ${id} was canceled`);
    auth.status = 'captured';
    return { ...auth };
  }

  async cancel(id: string): Promise<PaymentAuthorization> {
    const auth = this.store.get(id);
    if (!auth) throw new Error(`No authorization ${id}`);
    auth.status = 'canceled';
    return { ...auth };
  }

  /** Test/inspection helper — not part of the interface. */
  peek(id: string): PaymentAuthorization | undefined {
    const a = this.store.get(id);
    return a ? { ...a } : undefined;
  }
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripePromise } from "@/lib/stripe-client";
import { formatUsd } from "@/core/pricing";
import type { BookingRequest, Booking } from "@/core";

// Real card collection via Stripe Elements. Creates an escrow PaymentIntent
// (server computes the amount), confirms the card, then books with the verified
// intent id. Only mounted when a publishable key is configured.
export function StripeCheckout({
  request,
  onSuccess,
}: {
  request: BookingRequest;
  onSuccess: (booking: Booking) => void;
}) {
  const stripePromise = getStripePromise();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(request),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not start checkout");
        setClientSecret(data.clientSecret);
        setAmountCents(data.amountCents);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [request]);

  if (error) {
    return <p className="rounded-xl bg-gold/10 px-4 py-3 text-sm text-gold">{error}</p>;
  }
  if (!stripePromise) {
    return <p className="text-sm text-sage">Stripe is not configured.</p>;
  }
  if (!clientSecret) {
    return <p className="text-sm text-sage">Preparing secure checkout…</p>;
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <Elements
        stripe={stripePromise}
        options={{ clientSecret, appearance: { theme: "stripe" } }}
      >
        <PayForm request={request} amountCents={amountCents} onSuccess={onSuccess} />
      </Elements>
    </div>
  );
}

function PayForm({
  request,
  amountCents,
  onSuccess,
}: {
  request: BookingRequest;
  amountCents: number | null;
  onSuccess: (booking: Booking) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setErr(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: `${window.location.origin}/book` },
    });

    if (error) {
      setErr(error.message ?? "Payment failed");
      setSubmitting(false);
      return;
    }
    if (
      paymentIntent &&
      (paymentIntent.status === "requires_capture" || paymentIntent.status === "succeeded")
    ) {
      try {
        const res = await fetch("/api/book", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...request, paymentIntentId: paymentIntent.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Booking failed");
        onSuccess(data.booking as Booking);
      } catch (e) {
        setErr((e as Error).message);
        setSubmitting(false);
      }
    } else {
      setErr("Payment was not completed.");
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PaymentElement />
      {err && <p className="mt-3 text-sm text-gold">{err}</p>}
      <button
        onClick={pay}
        disabled={!stripe || submitting}
        className="mt-5 w-full rounded-full bg-forest px-7 py-3.5 text-sm font-medium text-ivory transition-colors hover:bg-emerald disabled:opacity-60"
      >
        {submitting
          ? "Processing…"
          : amountCents != null
            ? `Pay ${formatUsd(amountCents)} & confirm`
            : "Pay & confirm booking"}
      </button>
      <p className="mt-3 text-center text-xs text-sage">
        Your card is authorized now and only charged when your clean is verified
        complete.
      </p>
    </div>
  );
}

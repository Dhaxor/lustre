"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { quotePrice, formatUsd } from "@/core/pricing";
import { SERVICES, ADDONS, FREQUENCY_LABEL } from "@/core/catalog";
import type {
  BookingRequest,
  ServiceType,
  Frequency,
  TimeSlot,
  MembershipTier,
  RankedOffer,
  Booking,
} from "@/core";
import { LustreMark } from "@/components/site/Logo";
import { StripeCheckout } from "@/components/booking/StripeCheckout";
import { stripeConfiguredClient } from "@/lib/stripe-client";

const STEPS = ["Service", "Home", "Schedule", "Extras", "Confirm"] as const;

const SLOTS: { key: TimeSlot; label: string; time: string }[] = [
  { key: "morning", label: "Morning", time: "8–11 AM" },
  { key: "midday", label: "Midday", time: "11–2 PM" },
  { key: "afternoon", label: "Afternoon", time: "2–5 PM" },
  { key: "evening", label: "Evening", time: "5–8 PM" },
];

function nextDays(n: number): { iso: string; weekday: string; day: string; month: string }[] {
  const out: { iso: string; weekday: string; day: string; month: string }[] = [];
  const base = new Date();
  for (let i = 1; i <= n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({
      iso,
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
      day: String(d.getDate()),
      month: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return out;
}

export function BookingFlow() {
  const days = useMemo(() => nextDays(14), []);
  const stripeOn = stripeConfiguredClient();

  const [step, setStep] = useState(0);
  const [serviceType, setServiceType] = useState<ServiceType>("standard");
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [zip, setZip] = useState("10001");
  const [date, setDate] = useState(days[0].iso);
  const [slot, setSlot] = useState<TimeSlot>("morning");
  const [frequency, setFrequency] = useState<Frequency>("biweekly");
  const [addOns, setAddOns] = useState<string[]>([]);
  const [membershipTier, setMembershipTier] = useState<MembershipTier>("none");
  const [promoCode, setPromoCode] = useState("");

  const [matches, setMatches] = useState<RankedOffer[] | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request: BookingRequest = useMemo(
    () => ({
      customerId: "cust_demo",
      home: { zip, bedrooms, bathrooms },
      serviceType,
      addOns,
      frequency,
      window: { date, slot },
      membershipTier,
      promoCode: promoCode.trim() || undefined,
    }),
    [zip, bedrooms, bathrooms, serviceType, addOns, frequency, date, slot, membershipTier, promoCode],
  );

  const quote = useMemo(() => quotePrice(request), [request]);

  const toggleAddOn = (key: string) =>
    setAddOns((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const goMatch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not find a pro");
      setMatches(data.matches as RankedOffer[]);
      setStep(4);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      setBooking(data.booking as Booking);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const zipValid = /^\d{5}$/.test(zip);

  if (booking) return <Confirmation booking={booking} onReset={() => location.reload()} />;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.5fr_1fr]">
      {/* Left: steps */}
      <div>
        <Stepper step={step} />

        <div className="mt-8">
          {step === 0 && (
            <Panel title="What does your space need?">
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.values(SERVICES).map((s) => (
                  <button
                    key={s.type}
                    onClick={() => setServiceType(s.type)}
                    className={`rounded-2xl border p-5 text-left transition-all ${
                      serviceType === s.type
                        ? "border-emerald bg-emerald/5 ring-1 ring-emerald"
                        : "border-line bg-white hover:border-sage/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink">{s.name}</span>
                      <span className="text-sm text-sage">from ${Math.round(s.baseCents / 100)}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-sage">{s.blurb}</p>
                  </button>
                ))}
              </div>
            </Panel>
          )}

          {step === 1 && (
            <Panel title="Tell us about your home">
              <div className="space-y-6">
                <Stepper2 label="Bedrooms" value={bedrooms} setValue={setBedrooms} min={0} max={8} />
                <Stepper2 label="Bathrooms" value={bathrooms} setValue={setBathrooms} min={1} max={8} />
                <div>
                  <label className="text-sm font-medium text-ink">ZIP code</label>
                  <input
                    inputMode="numeric"
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder="e.g. 10001"
                    className="mt-2 w-40 rounded-xl border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-emerald"
                  />
                  {!zipValid && <p className="mt-1.5 text-xs text-gold">Enter a 5-digit ZIP.</p>}
                </div>
              </div>
            </Panel>
          )}

          {step === 2 && (
            <Panel title="When works for you?">
              <p className="text-sm font-medium text-ink">Pick a date</p>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {days.map((d) => (
                  <button
                    key={d.iso}
                    onClick={() => setDate(d.iso)}
                    className={`flex min-w-[64px] flex-col items-center rounded-xl border px-3 py-2.5 transition-all ${
                      date === d.iso ? "border-emerald bg-emerald/5 ring-1 ring-emerald" : "border-line bg-white hover:border-sage/40"
                    }`}
                  >
                    <span className="text-xs text-sage">{d.weekday}</span>
                    <span className="font-display text-lg text-ink">{d.day}</span>
                    <span className="text-xs text-sage">{d.month}</span>
                  </button>
                ))}
              </div>

              <p className="mt-6 text-sm font-medium text-ink">Arrival window</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SLOTS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSlot(s.key)}
                    className={`rounded-xl border px-3 py-3 text-center transition-all ${
                      slot === s.key ? "border-emerald bg-emerald/5 ring-1 ring-emerald" : "border-line bg-white hover:border-sage/40"
                    }`}
                  >
                    <span className="block text-sm font-medium text-ink">{s.label}</span>
                    <span className="block text-xs text-sage">{s.time}</span>
                  </button>
                ))}
              </div>

              <p className="mt-6 text-sm font-medium text-ink">How often?</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["one_time", "weekly", "biweekly", "monthly"] as Frequency[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={`rounded-xl border px-3 py-2.5 text-sm transition-all ${
                      frequency === f ? "border-emerald bg-emerald/5 text-ink ring-1 ring-emerald" : "border-line bg-white text-sage hover:border-sage/40"
                    }`}
                  >
                    {FREQUENCY_LABEL[f]}
                  </button>
                ))}
              </div>
              {frequency !== "one_time" && (
                <p className="mt-3 text-xs text-emerald">✓ Recurring plans are discounted — never surcharged.</p>
              )}
            </Panel>
          )}

          {step === 3 && (
            <Panel title="Any extras?">
              <div className="grid gap-2.5 sm:grid-cols-2">
                {Object.values(ADDONS).map((a) => {
                  const on = addOns.includes(a.key);
                  return (
                    <button
                      key={a.key}
                      onClick={() => toggleAddOn(a.key)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                        on ? "border-emerald bg-emerald/5 ring-1 ring-emerald" : "border-line bg-white hover:border-sage/40"
                      }`}
                    >
                      <span className="text-sm text-ink">{a.name}</span>
                      <span className="text-sm text-sage">+${Math.round(a.cents / 100)}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <label className="text-sm font-medium text-ink">Membership</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {([
                    ["none", "None"],
                    ["plus", "Lustre+ −10%"],
                    ["premier", "Premier −15%"],
                  ] as [MembershipTier, string][]).map(([tier, label]) => (
                    <button
                      key={tier}
                      onClick={() => setMembershipTier(tier)}
                      className={`rounded-xl border px-3 py-2.5 text-sm transition-all ${
                        membershipTier === tier ? "border-emerald bg-emerald/5 text-ink ring-1 ring-emerald" : "border-line bg-white text-sage hover:border-sage/40"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="text-sm font-medium text-ink">Promo code</label>
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Try SPARKLE15"
                  className="mt-2 w-48 rounded-xl border border-line bg-white px-4 py-2.5 text-ink outline-none focus:border-emerald"
                />
              </div>
            </Panel>
          )}

          {step === 4 && (
            <Panel title="Meet your matched pro">
              {matches && matches.length > 0 ? (
                <div className="space-y-4">
                  <ProCard ranked={matches[0]} top />
                  {matches.length > 1 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sage">
                        Backup pros (auto-dispatched if needed)
                      </p>
                      <div className="space-y-2">
                        {matches.slice(1, 3).map((m) => (
                          <ProCard key={m.offer.offerId} ranked={m} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sage">Finding your pro…</p>
              )}

              {stripeOn && matches && matches.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sage">
                    Secure payment
                  </p>
                  <StripeCheckout request={request} onSuccess={(b) => setBooking(b)} />
                </div>
              )}
            </Panel>
          )}

          {error && (
            <p className="mt-4 rounded-xl bg-gold/10 px-4 py-3 text-sm text-gold">{error}</p>
          )}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="rounded-full px-4 py-2.5 text-sm text-sage transition-colors hover:text-ink disabled:opacity-0"
            >
              ← Back
            </button>

            {step < 3 && (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && !zipValid}
                className="rounded-full bg-forest px-7 py-3 text-sm font-medium text-ivory transition-colors hover:bg-emerald disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
            )}
            {step === 3 && (
              <button
                onClick={goMatch}
                disabled={loading}
                className="rounded-full bg-forest px-7 py-3 text-sm font-medium text-ivory transition-colors hover:bg-emerald disabled:opacity-60"
              >
                {loading ? "Matching…" : "Find my pro →"}
              </button>
            )}
            {step === 4 && !stripeOn && (
              <button
                onClick={confirm}
                disabled={loading}
                className="rounded-full bg-forest px-7 py-3 text-sm font-medium text-ivory transition-colors hover:bg-emerald disabled:opacity-60"
              >
                {loading ? "Booking…" : "Confirm booking"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right: live quote */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border border-line bg-white p-6 shadow-[0_20px_60px_-30px_rgba(20,36,29,0.3)]">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-ink">Your quote</h3>
            <span className="rounded-full bg-emerald/10 px-2.5 py-1 text-xs font-medium text-emerald">
              All-in
            </span>
          </div>

          <div className="quiet-scroll mt-5 max-h-72 space-y-2.5 overflow-y-auto pr-1 text-sm">
            {quote.lineItems.map((li, i) => (
              <div key={i} className="flex items-start justify-between gap-3">
                <span className={li.kind === "discount" ? "text-emerald" : "text-sage"}>
                  {li.label}
                </span>
                <span className={li.kind === "discount" ? "shrink-0 text-emerald" : "shrink-0 text-ink"}>
                  {formatUsd(li.amountCents)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-line pt-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-sage">Total today</p>
                <p className="text-xs text-sage">≈ {quote.estimatedDurationMins} min on site</p>
              </div>
              <p className="font-display text-3xl text-ink">{formatUsd(quote.totalCents)}</p>
            </div>
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-ivory p-3 text-xs leading-relaxed text-sage">
            <LustreMark className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            Card is held, not charged, until your clean is verified complete. Cancel
            free up to 24h before.
          </p>
        </div>

        <p className="mt-3 text-center text-xs text-sage">
          Questions?{" "}
          <Link href="/#how" className="underline decoration-line underline-offset-2 hover:text-ink">
            See how it works
          </Link>
        </p>
      </aside>
    </div>
  );
}

/* --------------------------------------------------------- sub-parts */

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 text-xs">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full font-medium ${
              i < step ? "bg-emerald text-ivory" : i === step ? "bg-forest text-ivory" : "bg-cream text-sage"
            }`}
          >
            {i < step ? "✓" : i + 1}
          </span>
          <span className={i === step ? "font-medium text-ink" : "text-sage"}>{label}</span>
          {i < STEPS.length - 1 && <span className="mx-1 h-px w-5 bg-line" />}
        </li>
      ))}
    </ol>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="animate-rise">
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Stepper2({
  label,
  value,
  setValue,
  min,
  max,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="flex items-center gap-3">
        <RoundBtn onClick={() => setValue(Math.max(min, value - 1))} disabled={value <= min}>
          −
        </RoundBtn>
        <span className="w-8 text-center font-display text-xl text-ink">{value}</span>
        <RoundBtn onClick={() => setValue(Math.min(max, value + 1))} disabled={value >= max}>
          +
        </RoundBtn>
      </div>
    </div>
  );
}

function RoundBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-lg text-ink transition-colors hover:border-emerald disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ProCard({ ranked, top }: { ranked: RankedOffer; top?: boolean }) {
  const { offer, reasons } = ranked;
  const initial = offer.proName.charAt(0);
  return (
    <div
      className={`rounded-2xl border p-5 ${
        top ? "border-emerald bg-emerald/5" : "border-line bg-white"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full font-display text-lg ${
            top ? "bg-forest text-ivory" : "bg-cream text-ink"
          }`}
        >
          {initial}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-ink">{offer.proName}</p>
            {offer.rating > 0 && <p className="text-sm text-sage">★ {offer.rating.toFixed(2)}</p>}
          </div>
          {offer.blurb && <p className="mt-0.5 text-xs leading-relaxed text-sage">{offer.blurb}</p>}
        </div>
      </div>
      {reasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {reasons.map((r) => (
            <span
              key={r}
              className={`rounded-full px-2.5 py-1 text-xs ${
                r === "Your preferred pro" ? "bg-gold/15 text-gold" : "bg-white text-sage ring-1 ring-line"
              }`}
            >
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Confirmation({ booking, onReset }: { booking: Booking; onReset: () => void }) {
  const { offer, quote, request } = booking;
  return (
    <div className="mx-auto max-w-xl px-6 py-20 text-center">
      <div className="animate-rise rounded-3xl border border-line bg-white p-10 shadow-[0_20px_60px_-30px_rgba(20,36,29,0.3)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-emerald" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-3xl text-ink">You&apos;re booked.</h1>
        <p className="mt-2 text-sage">
          {offer.proName} is confirmed for your {request.window.slot} arrival.
        </p>

        <div className="mt-7 space-y-2.5 rounded-2xl bg-ivory p-5 text-left text-sm">
          <Line label="Pro" value={offer.proName} />
          <Line label="When" value={`${request.window.date} · ${request.window.slot}`} />
          <Line label="Plan" value={request.frequency.replace("_", "-")} />
          <Line label="Confirmation" value={booking.id} />
          <div className="border-t border-line" />
          <Line label="All-in total" value={formatUsd(quote.totalCents)} bold />
        </div>

        <p className="mt-4 text-xs text-sage">
          Your card is held, not charged, until the clean is verified complete. A
          receipt is on its way.
        </p>

        <div className="mt-7 flex justify-center gap-3">
          <button
            onClick={onReset}
            className="rounded-full border border-line px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-cream"
          >
            Book another
          </button>
          <Link
            href="/"
            className="rounded-full bg-forest px-6 py-3 text-sm font-medium text-ivory transition-colors hover:bg-emerald"
          >
            Done
          </Link>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sage">{label}</span>
      <span className={bold ? "font-display text-lg text-ink" : "text-ink"}>{value}</span>
    </div>
  );
}

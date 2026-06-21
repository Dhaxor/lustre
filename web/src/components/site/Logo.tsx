export function LustreMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 1.5c.5 4.6 2.4 6.5 7 7-4.6.5-6.5 2.4-7 7-.5-4.6-2.4-6.5-7-7 4.6-.5 6.5-2.4 7-7Z"
        fill="currentColor"
      />
      <circle cx="19" cy="4.5" r="1.4" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function Logo({ className = "", tone = "ink" }: { className?: string; tone?: "ink" | "ivory" }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LustreMark className="h-6 w-6 text-gold" />
      <span
        className={`font-display text-2xl ${tone === "ivory" ? "text-ivory" : "text-ink"}`}
      >
        Lustre
      </span>
    </span>
  );
}

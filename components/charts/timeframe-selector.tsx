"use client";

import { PRICE_RANGES, type PriceRange } from "@/lib/price-range";

const RANGE_LABELS: Record<PriceRange, string> = {
  "1D": "1D",
  "1W": "1W",
  "1M": "1M",
  "6M": "6M",
  "1Y": "1Y",
  "3Y": "3Y",
  "5Y": "5Y",
  "10Y": "10Y",
  MAX: "Max",
};

export function TimeframeSelector({
  value,
  onChange,
  disabled,
}: {
  value: PriceRange;
  onChange: (range: PriceRange) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
      {PRICE_RANGES.map((r) => (
        <button
          key={r}
          type="button"
          disabled={disabled}
          onClick={() => onChange(r)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
            value === r
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {RANGE_LABELS[r]}
        </button>
      ))}
    </div>
  );
}

type Numeric = number | string | { toString(): string } | null | undefined;

function toNumber(value: Numeric): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

/** Text color class for a signed value (price change, YoY growth, etc). */
export function gainLossText(value: Numeric): string {
  const n = toNumber(value);
  if (n > 0) return "text-gain";
  if (n < 0) return "text-loss";
  return "text-muted-foreground";
}

export function gainLossBg(value: Numeric): string {
  const n = toNumber(value);
  if (n > 0) return "bg-gain/10 text-gain";
  if (n < 0) return "bg-loss/10 text-loss";
  return "bg-muted text-muted-foreground";
}

/** Fixed-order categorical chart colors — never cycle/reassign per filter. */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
] as const;

export const SENTIMENT_STYLES: Record<string, string> = {
  POSITIVE: "bg-gain/10 text-gain",
  NEGATIVE: "bg-loss/10 text-loss",
  NEUTRAL: "bg-muted text-muted-foreground",
};

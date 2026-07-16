type Numeric = number | string | { toString(): string } | null | undefined;

function toNumber(value: Numeric): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value.toString());
  return Number.isFinite(n) ? n : null;
}

/** Formats a Rs Crore figure, auto-scaling to Lakh Cr past 1,00,000 Cr. */
export function formatCr(value: Numeric): string {
  const n = toNumber(value);
  if (n === null) return "—";
  if (Math.abs(n) >= 100000) {
    return `₹${(n / 100000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Lakh Cr`;
  }
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
}

/** Formats a raw rupee price, e.g. share price. */
export function formatINR(value: Numeric, opts?: { decimals?: number }): string {
  const n = toNumber(value);
  if (n === null) return "—";
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: opts?.decimals ?? 2,
    maximumFractionDigits: opts?.decimals ?? 2,
  })}`;
}

export function formatPercent(value: Numeric, opts?: { signed?: boolean }): string {
  const n = toNumber(value);
  if (n === null) return "—";
  const sign = opts?.signed && n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;
}

export function formatNumber(value: Numeric): string {
  const n = toNumber(value);
  if (n === null) return "—";
  return n.toLocaleString("en-IN");
}

export function formatCompact(value: Numeric): string {
  const n = toNumber(value);
  if (n === null) return "—";
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

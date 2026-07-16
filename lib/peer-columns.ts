/**
 * Single source of truth for the peer comparison table/dashboard's
 * selectable columns. Drives the column-editor dialog, the table's
 * rendering, and the dashboard's KPI tiles/charts.
 *
 * All fields here come from the same quoteSummary call already made per
 * peer (see `fetchPeerMetrics` in lib/yfinance.ts) — no extra network cost
 * per column. Deeper per-statement line items (Inventory, CapEx, D&A, etc.)
 * aren't in that payload and would need a separate per-peer fetch; they're
 * intentionally left out until that's built.
 */

import { formatCr, formatINR, formatPercent } from "./format";

export type PeerColumnFormat = "inr" | "cr" | "ratio" | "percent";
export type PeerColumnGroup =
  | "Price & Size"
  | "Valuation"
  | "Profitability"
  | "P&L"
  | "Leverage & Liquidity"
  | "Growth"
  | "Dividends";

export interface PeerColumnDef {
  key: keyof import("./yfinance").PeerMetrics;
  label: string;
  group: PeerColumnGroup;
  format: PeerColumnFormat;
  /** Raw fraction (0.091 = 9.1%) that needs *100 before percent formatting. */
  rawFraction?: boolean;
  /** Selected out of the box. */
  default?: boolean;
  /** Higher is worse (e.g. debt) — flips delta coloring in the dashboard. */
  invert?: boolean;
  /** Direction isn't clearly good/bad (e.g. market cap, P/E) — no delta coloring. */
  neutral?: boolean;
}

export const PEER_COLUMNS: PeerColumnDef[] = [
  // Price & Size
  { key: "price", label: "Price", group: "Price & Size", format: "inr", default: true, neutral: true },
  { key: "changePercent", label: "Change", group: "Price & Size", format: "percent", default: true },
  { key: "marketCap", label: "Market Cap", group: "Price & Size", format: "cr", default: true, neutral: true },
  { key: "fiftyTwoWeekHigh", label: "52W High", group: "Price & Size", format: "inr", neutral: true },
  { key: "fiftyTwoWeekLow", label: "52W Low", group: "Price & Size", format: "inr", neutral: true },

  // Valuation
  { key: "peRatio", label: "P/E Ratio", group: "Valuation", format: "ratio", default: true, neutral: true },
  { key: "forwardPE", label: "Forward P/E", group: "Valuation", format: "ratio", neutral: true },
  { key: "priceToBook", label: "P/B Ratio", group: "Valuation", format: "ratio", default: true, neutral: true },
  { key: "pegRatio", label: "PEG Ratio", group: "Valuation", format: "ratio", neutral: true },
  { key: "priceToSales", label: "P/S Ratio", group: "Valuation", format: "ratio", neutral: true },
  { key: "enterpriseValue", label: "Enterprise Value", group: "Valuation", format: "cr", neutral: true },
  { key: "evToEbitda", label: "EV / EBITDA", group: "Valuation", format: "ratio", neutral: true },
  { key: "evToRevenue", label: "EV / Revenue", group: "Valuation", format: "ratio", neutral: true },
  { key: "beta", label: "Beta", group: "Valuation", format: "ratio", neutral: true },

  // Profitability
  { key: "roe", label: "ROE", group: "Profitability", format: "percent", rawFraction: true, default: true },
  { key: "roa", label: "ROA", group: "Profitability", format: "percent", rawFraction: true },
  { key: "netMargin", label: "Net Margin", group: "Profitability", format: "percent", rawFraction: true, default: true },
  { key: "grossMargin", label: "Gross Margin", group: "Profitability", format: "percent", rawFraction: true },
  { key: "operatingMargin", label: "Operating Margin", group: "Profitability", format: "percent", rawFraction: true },
  { key: "ebitdaMargin", label: "EBITDA Margin", group: "Profitability", format: "percent", rawFraction: true },

  // P&L essentials
  { key: "revenue", label: "Revenue", group: "P&L", format: "cr", neutral: true },
  { key: "grossProfit", label: "Gross Profit", group: "P&L", format: "cr" },
  { key: "ebitda", label: "EBITDA", group: "P&L", format: "cr" },
  { key: "netIncome", label: "Net Income", group: "P&L", format: "cr" },
  { key: "trailingEps", label: "Trailing EPS", group: "P&L", format: "inr" },
  { key: "forwardEps", label: "Forward EPS", group: "P&L", format: "inr" },

  // Leverage & Liquidity
  { key: "debtToEquity", label: "Debt / Equity", group: "Leverage & Liquidity", format: "ratio", default: true, invert: true },
  { key: "totalDebt", label: "Total Debt", group: "Leverage & Liquidity", format: "cr", invert: true },
  { key: "totalCash", label: "Total Cash", group: "Leverage & Liquidity", format: "cr" },
  { key: "currentRatio", label: "Current Ratio", group: "Leverage & Liquidity", format: "ratio" },
  { key: "quickRatio", label: "Quick Ratio", group: "Leverage & Liquidity", format: "ratio" },
  { key: "operatingCashFlow", label: "Operating Cash Flow", group: "Leverage & Liquidity", format: "cr" },
  { key: "freeCashFlow", label: "Free Cash Flow", group: "Leverage & Liquidity", format: "cr" },

  // Growth
  { key: "revenueGrowth", label: "Revenue Growth", group: "Growth", format: "percent", rawFraction: true },
  { key: "earningsGrowth", label: "Earnings Growth", group: "Growth", format: "percent", rawFraction: true },
  { key: "earningsQuarterlyGrowth", label: "Quarterly Earnings Growth", group: "Growth", format: "percent", rawFraction: true },

  // Dividends
  { key: "dividendYield", label: "Dividend Yield", group: "Dividends", format: "percent", rawFraction: true },
  { key: "payoutRatio", label: "Payout Ratio", group: "Dividends", format: "percent", rawFraction: true },
];

export const DEFAULT_PEER_COLUMN_KEYS = PEER_COLUMNS.filter((c) => c.default).map((c) => c.key as string);

export const PEER_COLUMN_GROUPS: PeerColumnGroup[] = [
  "Price & Size",
  "Valuation",
  "Profitability",
  "P&L",
  "Leverage & Liquidity",
  "Growth",
  "Dividends",
];

export function getPeerColumn(key: string): PeerColumnDef | undefined {
  return PEER_COLUMNS.find((c) => c.key === key);
}

/** Resolves selected keys to their column defs, in registry order, dropping unknown/removed keys. */
export function resolvePeerColumns(keys: string[]): PeerColumnDef[] {
  const set = new Set(keys);
  return PEER_COLUMNS.filter((c) => set.has(c.key as string));
}

function formatByType(column: PeerColumnDef, value: number, crAlreadyScaled: boolean): string {
  switch (column.format) {
    case "cr":
      return formatCr(crAlreadyScaled ? value : value / 1e7);
    case "inr":
      return formatINR(value);
    case "percent":
      return formatPercent(value, { signed: true });
    case "ratio":
    default:
      return value.toFixed(2);
  }
}

export function formatPeerValue(column: PeerColumnDef, raw: number | null | undefined): string {
  if (raw === null || raw === undefined || !Number.isFinite(raw)) return "—";
  const value = column.rawFraction ? raw * 100 : raw;
  return formatByType(column, value, false);
}

/** Scales a raw value the way charts/KPI tiles want it (fractions -> %, rupees -> Cr). */
export function toChartValue(column: PeerColumnDef, raw: number | null | undefined): number | null {
  if (raw === null || raw === undefined || !Number.isFinite(raw)) return null;
  const value = column.rawFraction ? raw * 100 : raw;
  return column.format === "cr" ? value / 1e7 : value;
}

/** Formats an already-scaled value (output of `toChartValue`) for axis ticks/tooltips. */
export function formatChartValue(column: PeerColumnDef, value: number): string {
  return formatByType(column, value, true);
}

/**
 * Whether this metric is suited to a share-of-total pie/donut chart rather
 * than a ranking bar chart. Only absolute money amounts (`cr`) are
 * compositional across a peer group — ratios/percents/per-share values
 * (P/E, margins, EPS, price) don't sum to anything meaningful. Even for
 * `cr` metrics, a pie only makes sense when every company's value is
 * non-negative and the total is positive (Net Income, FCF, etc. can go
 * negative, which a pie can't represent).
 */
export function isShareChartEligible(column: PeerColumnDef, values: (number | null)[]): boolean {
  if (column.format !== "cr") return false;
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (nums.length === 0) return false;
  return nums.every((v) => v >= 0) && nums.reduce((a, b) => a + b, 0) > 0;
}

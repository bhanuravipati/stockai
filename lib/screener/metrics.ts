/**
 * Metric-name resolution for the screener query language. Builds a lookup
 * from every normalized label/key/alias in `PEER_COLUMNS` to its column def,
 * so the tokenizer/parser and the UI's autocomplete share one source of
 * truth — a new metric added to `PEER_COLUMNS` is screenable automatically.
 */

import { PEER_COLUMNS, type PeerColumnDef } from "../peer-columns";

/** Lowercases and strips everything but letters/digits, so "P/E Ratio", "pe-ratio" and "peRatio" all collapse to the same key. */
export function normalizeMetricName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Short codes that don't derive cleanly from a label or camelCase key. */
export const ALIASES: Record<string, PeerColumnDef["key"]> = {
  pe: "peRatio",
  pb: "priceToBook",
  ps: "priceToSales",
  peg: "pegRatio",
  eps: "trailingEps",
  fcf: "freeCashFlow",
  ocf: "operatingCashFlow",
  mcap: "marketCap",
  cap: "marketCap",
  ev: "enterpriseValue",
  de: "debtToEquity",
  cash: "totalCash",
  debt: "totalDebt",
};

export const METRIC_LOOKUP: Map<string, PeerColumnDef> = new Map();

for (const column of PEER_COLUMNS) {
  METRIC_LOOKUP.set(normalizeMetricName(column.label), column);
  METRIC_LOOKUP.set(normalizeMetricName(column.key as string), column);
}
for (const [alias, key] of Object.entries(ALIASES)) {
  const column = PEER_COLUMNS.find((c) => c.key === key);
  if (column) METRIC_LOOKUP.set(normalizeMetricName(alias), column);
}

export function matchMetric(phrase: string): PeerColumnDef | undefined {
  return METRIC_LOOKUP.get(normalizeMetricName(phrase));
}

/** Metric suggestions for autocomplete — label or key starting with `prefix`, registry order, capped. */
export function metricSuggestions(prefix: string, limit = 6): PeerColumnDef[] {
  const norm = normalizeMetricName(prefix);
  if (!norm) return PEER_COLUMNS.slice(0, limit);
  const seen = new Set<string>();
  const out: PeerColumnDef[] = [];
  for (const column of PEER_COLUMNS) {
    if (seen.has(column.key as string)) continue;
    const labelNorm = normalizeMetricName(column.label);
    const keyNorm = normalizeMetricName(column.key as string);
    if (labelNorm.startsWith(norm) || keyNorm.startsWith(norm)) {
      seen.add(column.key as string);
      out.push(column);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/** Unit the user should type values in — matches how `toChartValue` scales the raw metric. */
export function unitLabel(column: PeerColumnDef): string {
  switch (column.format) {
    case "cr":
      return "₹ Cr";
    case "percent":
      return "%";
    case "ratio":
      return "×";
    case "inr":
    default:
      return "₹";
  }
}

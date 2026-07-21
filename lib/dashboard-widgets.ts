/**
 * Dashboard v2 — widget model shared by the Peers tab, Compare, and Industry
 * dashboards (see `components/company/comparison-dashboard.tsx`). A widget
 * is either backed by one metric (bar ranking or pie/donut share — the two
 * chart types the dashboard has always had) or two metrics (scatter,
 * metric-vs-metric). Column-backed widgets (`buildDefaultWidgets`) are
 * generated from the existing `cols` selection (`lib/peer-columns.ts`) —
 * this file doesn't change what metrics are selectable, only how the
 * resulting charts are represented and (for bar/pie) overridden.
 */

import { isShareChartEligible, getPeerColumn, type PeerColumnDef } from "./peer-columns";
import type { PeerMetrics } from "./yfinance";
import { toChartValue } from "./peer-columns";

export type DashboardWidget =
  | { id: string; type: "bar" | "pie"; xKey: string }
  | { id: string; type: "scatter"; xKey: string; yKey: string };

export type ChartTypeOverrides = Record<string, "bar" | "pie">;

/**
 * One widget per selected column, chart type auto-picked exactly like the
 * dashboard has always decided it (`isShareChartEligible`), unless the
 * caller has an explicit override for that column (see the bar/pie toggle
 * on eligible widget cards).
 */
export function buildDefaultWidgets(
  columns: PeerColumnDef[],
  companies: PeerMetrics[],
  overrides: ChartTypeOverrides = {}
): DashboardWidget[] {
  return columns.map((column) => {
    const key = column.key as string;
    const values = companies.map((c) => toChartValue(column, c[column.key] as number | null | undefined));
    const eligible = isShareChartEligible(column, values);
    const type = overrides[key] === "bar" || overrides[key] === "pie" ? overrides[key] : eligible ? "pie" : "bar";
    return { id: `col:${key}`, type, xKey: key };
  });
}

/**
 * Compact URL-param encoding for Compare/Industry, mirroring the `cols`
 * param's comma-joined-keys convention. Only *custom* (scatter) widgets and
 * bar/pie *overrides* need encoding — column-backed widgets in their
 * auto-picked chart type are already fully determined by the existing
 * `cols` param, so there's no redundant state to serialize.
 *
 * Format: comma-separated `type:key` (override) or `scatter:xKey:yKey`
 * (custom widget) entries, e.g. "bar:revenue,scatter:peRatio:roe".
 */
export function encodeWidgetsParam(customWidgets: DashboardWidget[], overrides: ChartTypeOverrides): string {
  const overrideParts = Object.entries(overrides).map(([key, type]) => `${type}:${key}`);
  const scatterParts = customWidgets
    .filter((w): w is Extract<DashboardWidget, { type: "scatter" }> => w.type === "scatter")
    .map((w) => `scatter:${w.xKey}:${w.yKey}`);
  return [...overrideParts, ...scatterParts].join(",");
}

export function parseWidgetsParam(param: string | null | undefined): {
  customWidgets: DashboardWidget[];
  overrides: ChartTypeOverrides;
} {
  const overrides: ChartTypeOverrides = {};
  const customWidgets: DashboardWidget[] = [];
  if (!param) return { customWidgets, overrides };

  for (const part of param.split(",").map((s) => s.trim()).filter(Boolean)) {
    const segments = part.split(":");
    if (segments[0] === "scatter" && segments.length === 3) {
      const [, xKey, yKey] = segments;
      if (getPeerColumn(xKey) && getPeerColumn(yKey)) {
        customWidgets.push({ id: `scatter:${xKey}:${yKey}`, type: "scatter", xKey, yKey });
      }
    } else if ((segments[0] === "bar" || segments[0] === "pie") && segments.length === 2) {
      const [type, key] = segments;
      if (getPeerColumn(key)) overrides[key] = type as "bar" | "pie";
    }
  }
  return { customWidgets, overrides };
}

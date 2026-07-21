import { BarChart3Icon, PieChartIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiStat } from "@/components/company/kpi-stat";
import { PeerRankingChart } from "@/components/company/peer-ranking-chart";
import { PeerShareChart, type PeerShareDatum } from "@/components/company/peer-share-chart";
import { PeerScatterChart } from "@/components/company/peer-scatter-chart";
import { formatChartValue, getPeerColumn, isShareChartEligible, toChartValue } from "@/lib/peer-columns";
import type { DashboardWidget } from "@/lib/dashboard-widgets";
import type { PeerMetrics } from "@/lib/yfinance";
import { cn } from "@/lib/utils";

function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function pctChange(current: number | null, baseline: number | null): number | null {
  if (current == null || baseline == null || baseline === 0) return null;
  return ((current - baseline) / Math.abs(baseline)) * 100;
}

/**
 * The comparison dashboard shared by the Peers tab, Compare, and Industry —
 * replaces the former PeerDashboard/CompareDashboard split (they were
 * structurally near-identical; PeerDashboard was CompareDashboard plus a KPI
 * section). Renders a widget grid (see `lib/dashboard-widgets.ts`) instead of
 * one auto-picked chart per selected column: each widget already carries its
 * own resolved chart type, so this component is a pure `widget -> chart`
 * dispatcher plus the current-vs-peer KPI tiles.
 *
 * KPI tiles only appear when `companies` includes one with `isCurrent` set
 * (the Peers tab) — Compare/Industry have no "current" company and simply
 * don't get that section, exactly like the components this replaces.
 */
export function ComparisonDashboard({
  companies,
  widgets,
  colorMap,
  industry,
  onOverrideChange,
  onRemoveWidget,
}: {
  companies: PeerMetrics[];
  widgets: DashboardWidget[];
  /** Per-company fill color (Compare/Industry). Omit for the Peers tab's current/peer 2-tone. */
  colorMap?: Record<string, string>;
  /** Peers tab only — shown in the KPI section's caption. */
  industry?: string;
  /** Flips a bar<->pie widget's chart type (only shown when the metric is eligible for both — see isShareChartEligible). Omit to hide the toggle. */
  onOverrideChange?: (columnKey: string, type: "bar" | "pie") => void;
  /** Removes a custom (scatter) widget. Column-backed bar/pie widgets are removed via Edit Columns instead, so this only applies to scatter. Omit to hide the remove button. */
  onRemoveWidget?: (widgetId: string) => void;
}) {
  const current = companies.find((c) => c.isCurrent);
  const peers = companies.filter((c) => !c.isCurrent);

  if (colorMap === undefined && (!current || peers.length === 0)) {
    return <p className="text-sm text-muted-foreground">Not enough peer data available for a comparison.</p>;
  }
  if (colorMap !== undefined && companies.length < 2) {
    return <p className="text-sm text-muted-foreground">Add at least one more company to see comparison charts.</p>;
  }
  if (widgets.length === 0) {
    return <p className="text-sm text-muted-foreground">No columns selected — use Edit columns to add some.</p>;
  }

  const kpiWidgets = widgets.filter((w): w is Extract<DashboardWidget, { type: "bar" | "pie" }> => w.type !== "scatter");

  return (
    <div className="space-y-8">
      {current && peers.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            {current.name} vs. {peers.length} peer{peers.length === 1 ? "" : "s"}
            {industry ? ` in ${industry}` : ""}
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpiWidgets.map((widget) => {
              const column = getPeerColumn(widget.xKey);
              if (!column) return null;
              const currentValue = toChartValue(column, current[column.key] as number | null | undefined);
              const peerAvg = average(peers.map((p) => toChartValue(column, p[column.key] as number | null | undefined)));
              return (
                <KpiStat
                  key={widget.id}
                  label={column.label}
                  value={currentValue != null ? formatChartValue(column, currentValue) : "—"}
                  delta={pctChange(currentValue, peerAvg)}
                  invertDelta={column.invert}
                  neutral={column.neutral}
                />
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Deltas compare against the peer group average.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {widgets.map((widget) => {
          if (widget.type === "scatter") {
            const xColumn = getPeerColumn(widget.xKey);
            const yColumn = getPeerColumn(widget.yKey);
            if (!xColumn || !yColumn) return null;
            const data = companies.map((c) => ({
              name: c.isCurrent ? c.name : c.symbol,
              x: toChartValue(xColumn, c[xColumn.key] as number | null | undefined),
              y: toChartValue(yColumn, c[yColumn.key] as number | null | undefined),
              isCurrent: c.isCurrent,
              color: colorMap?.[c.symbol],
            }));
            return (
              <div key={widget.id} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-foreground">
                    {xColumn.label} vs. {yColumn.label}
                  </h3>
                  {onRemoveWidget && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => onRemoveWidget(widget.id)}
                      aria-label={`Remove ${xColumn.label} vs. ${yColumn.label} chart`}
                    >
                      <XIcon className="size-3.5" />
                    </Button>
                  )}
                </div>
                <PeerScatterChart
                  data={data}
                  xLabel={xColumn.label}
                  yLabel={yColumn.label}
                  xFormatter={(v) => formatChartValue(xColumn, v)}
                  yFormatter={(v) => formatChartValue(yColumn, v)}
                  currentLabel={current?.name}
                />
              </div>
            );
          }

          const column = getPeerColumn(widget.xKey);
          if (!column) return null;
          const data = companies.map((c) => ({
            name: c.isCurrent ? c.name : c.symbol,
            value: toChartValue(column, c[column.key] as number | null | undefined),
            isCurrent: c.isCurrent,
            color: colorMap?.[c.symbol],
          }));
          const eligibleForBoth = isShareChartEligible(
            column,
            data.map((d) => d.value)
          );
          return (
            <div key={widget.id} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-foreground">{column.label}</h3>
                {onOverrideChange && eligibleForBoth && (
                  <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("size-6", widget.type === "bar" && "bg-muted")}
                      onClick={() => onOverrideChange(column.key as string, "bar")}
                      aria-label={`Show ${column.label} as a bar chart`}
                    >
                      <BarChart3Icon className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("size-6", widget.type === "pie" && "bg-muted")}
                      onClick={() => onOverrideChange(column.key as string, "pie")}
                      aria-label={`Show ${column.label} as a pie chart`}
                    >
                      <PieChartIcon className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              {widget.type === "pie" ? (
                <PeerShareChart
                  data={data
                    .filter((d) => d.value != null)
                    .map((d): PeerShareDatum => ({ name: d.name, value: d.value as number, isCurrent: d.isCurrent, color: d.color }))}
                  valueFormatter={(v) => formatChartValue(column, v)}
                />
              ) : (
                <PeerRankingChart
                  data={data}
                  valueFormatter={(v) => formatChartValue(column, v)}
                  currentLabel={current?.name}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

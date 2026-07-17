import { PeerRankingChart } from "@/components/company/peer-ranking-chart";
import { PeerShareChart } from "@/components/company/peer-share-chart";
import { formatChartValue, isShareChartEligible, toChartValue, type PeerColumnDef } from "@/lib/peer-columns";
import type { PeerMetrics } from "@/lib/yfinance";

/**
 * The Compare page's dashboard — unlike PeerDashboard (Peers tab), there's no
 * "current" company to diff against, so this is a pure leaderboard: one
 * ranking/share chart per selected metric, every company colored consistently
 * via `colorMap` (see CompanyColorLegend).
 */
export function CompareDashboard({
  companies,
  columns,
  colorMap,
}: {
  companies: PeerMetrics[];
  columns: PeerColumnDef[];
  colorMap: Record<string, string>;
}) {
  if (companies.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Add at least one more company to see comparison charts.
      </p>
    );
  }
  if (columns.length === 0) {
    return <p className="text-sm text-muted-foreground">No columns selected — use Edit columns to add some.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {columns.map((column) => {
        const data = companies.map((c) => ({
          name: c.name,
          value: toChartValue(column, c[column.key] as number | null | undefined),
          color: colorMap[c.symbol],
        }));
        const useShareChart = isShareChartEligible(
          column,
          data.map((d) => d.value)
        );
        return (
          <div key={column.key} className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium text-foreground">{column.label}</h3>
            {useShareChart ? (
              <PeerShareChart
                data={data.filter((d): d is { name: string; value: number; color: string } => d.value != null)}
                valueFormatter={(v) => formatChartValue(column, v)}
              />
            ) : (
              <PeerRankingChart data={data} valueFormatter={(v) => formatChartValue(column, v)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

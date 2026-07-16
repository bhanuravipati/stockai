import { KpiStat } from "@/components/company/kpi-stat";
import { PeerRankingChart } from "@/components/company/peer-ranking-chart";
import { PeerShareChart } from "@/components/company/peer-share-chart";
import { formatChartValue, isShareChartEligible, toChartValue, type PeerColumnDef } from "@/lib/peer-columns";
import type { PeerMetrics } from "@/lib/yfinance";

function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v != null && Number.isFinite(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function pctChange(current: number | null, baseline: number | null): number | null {
  if (current == null || baseline == null || baseline === 0) return null;
  return ((current - baseline) / Math.abs(baseline)) * 100;
}

export function PeerDashboard({
  companies,
  columns,
  industry,
}: {
  companies: PeerMetrics[];
  columns: PeerColumnDef[];
  industry?: string;
}) {
  const current = companies.find((c) => c.isCurrent);
  const peers = companies.filter((c) => !c.isCurrent);

  if (!current || peers.length === 0) {
    return <p className="text-sm text-muted-foreground">Not enough peer data available for a comparison.</p>;
  }
  if (columns.length === 0) {
    return <p className="text-sm text-muted-foreground">No columns selected — use Edit columns to add some.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          {current.name} vs. {peers.length} peer{peers.length === 1 ? "" : "s"}
          {industry ? ` in ${industry}` : ""}
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {columns.map((column) => {
            const currentValue = toChartValue(column, current[column.key] as number | null | undefined);
            const peerAvg = average(peers.map((p) => toChartValue(column, p[column.key] as number | null | undefined)));
            return (
              <KpiStat
                key={column.key}
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

      <div className="grid gap-6 lg:grid-cols-2">
        {columns.map((column) => {
          const data = companies.map((c) => ({
            name: c.isCurrent ? c.name : c.symbol,
            value: toChartValue(column, c[column.key] as number | null | undefined),
            isCurrent: c.isCurrent,
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
                  data={data.filter((d): d is { name: string; value: number; isCurrent: boolean } => d.value != null)}
                  valueFormatter={(v) => formatChartValue(column, v)}
                />
              ) : (
                <PeerRankingChart
                  data={data}
                  valueFormatter={(v) => formatChartValue(column, v)}
                  currentLabel={current.name}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

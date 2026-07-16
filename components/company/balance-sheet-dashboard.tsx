import { TrendChart } from "@/components/charts/trend-chart";
import { CompositionBars } from "@/components/company/composition-bars";
import { KpiStat } from "@/components/company/kpi-stat";
import { formatCr } from "@/lib/format";
import { CHART_COLORS } from "@/lib/colors";

interface BalanceSheetPeriod {
  periodLabel: string;
  periodType?: "annual" | "quarterly";
  totalAssets?: number;
  totalLiabilities?: number;
  stockholdersEquity?: number;
  currentAssets?: number;
  cashAndCashEquivalents?: number;
  inventory?: number;
  accountsReceivable?: number;
  netPPE?: number;
  currentLiabilities?: number;
  totalDebt?: number;
  workingCapital?: number;
  netDebt?: number;
}

function pctChange(current?: number | null, previous?: number | null): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function ratio(a?: number, b?: number): number | null {
  if (a == null || !b) return null;
  return a / b;
}

export function BalanceSheetDashboard({ statements }: { statements: BalanceSheetPeriod[] }) {
  if (statements.length === 0) {
    return <p className="text-sm text-muted-foreground">No data available for this period.</p>;
  }

  // Comparing a full year against a single prior quarter produces misleading
  // deltas, so trends/KPIs default to annual periods when enough exist.
  const annual = statements.filter((s) => s.periodType !== "quarterly");
  const statementsForTrend = annual.length > 1 ? annual : statements;

  const latest = statementsForTrend[statementsForTrend.length - 1];
  const previous = statementsForTrend.length > 1 ? statementsForTrend[statementsForTrend.length - 2] : undefined;

  const trendData = statementsForTrend.map((s) => ({
    period: s.periodLabel,
    "Total Assets": s.totalAssets ?? null,
    "Total Liabilities": s.totalLiabilities ?? null,
    Equity: s.stockholdersEquity ?? null,
  }));

  const currentRatioData = statementsForTrend.map((s) => ({
    period: s.periodLabel,
    "Current Ratio": ratio(s.currentAssets, s.currentLiabilities),
  }));

  const netDebtData = statementsForTrend.map((s) => ({
    period: s.periodLabel,
    "Net Debt": s.netDebt ?? (s.totalDebt != null ? s.totalDebt - (s.cashAndCashEquivalents ?? 0) : null),
  }));

  const latestDte = ratio(latest.totalLiabilities, latest.stockholdersEquity);
  const previousDte = ratio(previous?.totalLiabilities, previous?.stockholdersEquity);
  const latestCurrentRatio = ratio(latest.currentAssets, latest.currentLiabilities);
  const previousCurrentRatio = ratio(previous?.currentAssets, previous?.currentLiabilities);

  const totalAssets = latest.totalAssets ?? 0;
  const knownAssetParts =
    (latest.cashAndCashEquivalents ?? 0) + (latest.inventory ?? 0) + (latest.accountsReceivable ?? 0) + (latest.netPPE ?? 0);
  const otherAssets = Math.max(totalAssets - knownAssetParts, 0);

  const compositionRows = [
    { label: "Cash & Equivalents", value: latest.cashAndCashEquivalents ?? 0, color: CHART_COLORS[0] },
    { label: "Inventory", value: latest.inventory ?? 0, color: CHART_COLORS[2] },
    { label: "Accounts Receivable", value: latest.accountsReceivable ?? 0, color: CHART_COLORS[4] },
    { label: "Net PPE", value: latest.netPPE ?? 0, color: CHART_COLORS[7] },
    ...(otherAssets > 0 ? [{ label: "Other Assets", value: otherAssets, color: "var(--muted-foreground)" }] : []),
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Latest period · {latest.periodLabel}</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiStat
            label="Total Assets"
            value={formatCr((latest.totalAssets ?? 0) / 1e7)}
            delta={pctChange(latest.totalAssets, previous?.totalAssets)}
          />
          <KpiStat
            label="Total Liabilities"
            value={formatCr((latest.totalLiabilities ?? 0) / 1e7)}
            delta={pctChange(latest.totalLiabilities, previous?.totalLiabilities)}
            invertDelta
          />
          <KpiStat
            label="Stockholders' Equity"
            value={formatCr((latest.stockholdersEquity ?? 0) / 1e7)}
            delta={pctChange(latest.stockholdersEquity, previous?.stockholdersEquity)}
          />
          <KpiStat
            label="Debt / Equity"
            value={latestDte != null ? latestDte.toFixed(2) : "—"}
            delta={pctChange(latestDte, previousDte)}
            invertDelta
          />
          <KpiStat
            label="Current Ratio"
            value={latestCurrentRatio != null ? latestCurrentRatio.toFixed(2) : "—"}
            delta={pctChange(latestCurrentRatio, previousCurrentRatio)}
          />
          <KpiStat
            label="Cash & Equivalents"
            value={formatCr((latest.cashAndCashEquivalents ?? 0) / 1e7)}
            delta={pctChange(latest.cashAndCashEquivalents, previous?.cashAndCashEquivalents)}
          />
          <KpiStat
            label="Total Debt"
            value={formatCr((latest.totalDebt ?? 0) / 1e7)}
            delta={pctChange(latest.totalDebt, previous?.totalDebt)}
            invertDelta
          />
          <KpiStat
            label="Working Capital"
            value={formatCr((latest.workingCapital ?? 0) / 1e7)}
            delta={pctChange(latest.workingCapital, previous?.workingCapital)}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Assets, Liabilities & Equity</h3>
          <TrendChart
            data={trendData}
            xKey="period"
            series={[
              { key: "Total Assets", label: "Total Assets", color: CHART_COLORS[0] },
              { key: "Total Liabilities", label: "Total Liabilities", color: CHART_COLORS[5] },
              { key: "Equity", label: "Equity", color: CHART_COLORS[3] },
            ]}
            valueFormatter={(v) => formatCr(v / 1e7)}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Current Ratio</h3>
          <TrendChart
            data={currentRatioData}
            xKey="period"
            series={[{ key: "Current Ratio", label: "Current Ratio", color: CHART_COLORS[0] }]}
            valueFormatter={(v) => v.toFixed(2)}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Net Debt</h3>
          <TrendChart
            data={netDebtData}
            xKey="period"
            series={[{ key: "Net Debt", label: "Net Debt", color: CHART_COLORS[5] }]}
            valueFormatter={(v) => formatCr(v / 1e7)}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Asset Composition · {latest.periodLabel}</h3>
          <CompositionBars rows={compositionRows} total={totalAssets} />
        </div>
      </div>
    </div>
  );
}

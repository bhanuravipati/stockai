import { TrendChart } from "@/components/charts/trend-chart";
import { CompositionBars } from "@/components/company/composition-bars";
import { KpiStat } from "@/components/company/kpi-stat";
import { formatCr } from "@/lib/format";
import { CHART_COLORS } from "@/lib/colors";

interface IncomeStatementPeriod {
  periodLabel: string;
  periodType?: "annual" | "quarterly";
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  costOfRevenue?: number;
  operatingExpense?: number;
  ebitda?: number;
  taxProvision?: number;
  dilutedEps?: number;
  basicEps?: number;
}

function pctChange(current?: number | null, previous?: number | null): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function ProfitLossDashboard({ statements }: { statements: IncomeStatementPeriod[] }) {
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
    Revenue: s.revenue ?? null,
    EBITDA: s.ebitda ?? null,
    "Net Income": s.netIncome ?? null,
  }));

  const marginData = statementsForTrend.map((s) => ({
    period: s.periodLabel,
    "Gross Margin": s.revenue ? ((s.grossProfit ?? 0) / s.revenue) * 100 : null,
    "Operating Margin": s.revenue ? ((s.operatingIncome ?? 0) / s.revenue) * 100 : null,
    "Net Margin": s.revenue ? ((s.netIncome ?? 0) / s.revenue) * 100 : null,
  }));

  const epsData = statementsForTrend.map((s) => ({
    period: s.periodLabel,
    "Basic EPS": s.basicEps ?? null,
    "Diluted EPS": s.dilutedEps ?? null,
  }));

  const revenue = latest.revenue ?? 0;
  const accountedFor =
    (latest.costOfRevenue ?? 0) + (latest.operatingExpense ?? 0) + (latest.taxProvision ?? 0) + (latest.netIncome ?? 0);
  const other = Math.max(revenue - accountedFor, 0);

  const compositionRows = [
    { label: "Cost of Revenue", value: latest.costOfRevenue ?? 0, color: CHART_COLORS[5] },
    { label: "Operating Expense", value: latest.operatingExpense ?? 0, color: CHART_COLORS[7] },
    { label: "Tax Provision", value: latest.taxProvision ?? 0, color: CHART_COLORS[2] },
    { label: "Net Income", value: latest.netIncome ?? 0, color: CHART_COLORS[3] },
    ...(other > 0 ? [{ label: "Other", value: other, color: "var(--muted-foreground)" }] : []),
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Latest period · {latest.periodLabel}</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiStat
            label="Revenue"
            value={formatCr((latest.revenue ?? 0) / 1e7)}
            delta={pctChange(latest.revenue, previous?.revenue)}
          />
          <KpiStat
            label="Net Income"
            value={formatCr((latest.netIncome ?? 0) / 1e7)}
            delta={pctChange(latest.netIncome, previous?.netIncome)}
          />
          <KpiStat
            label="EBITDA"
            value={formatCr((latest.ebitda ?? 0) / 1e7)}
            delta={pctChange(latest.ebitda, previous?.ebitda)}
          />
          <KpiStat
            label="Diluted EPS (₹)"
            value={latest.dilutedEps != null ? latest.dilutedEps.toFixed(2) : "—"}
            delta={pctChange(latest.dilutedEps, previous?.dilutedEps)}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Revenue, EBITDA & Net Income</h3>
          <TrendChart
            data={trendData}
            xKey="period"
            series={[
              { key: "Revenue", label: "Revenue", color: CHART_COLORS[0] },
              { key: "EBITDA", label: "EBITDA", color: CHART_COLORS[2] },
              { key: "Net Income", label: "Net Income", color: CHART_COLORS[3] },
            ]}
            valueFormatter={(v) => formatCr(v / 1e7)}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Margin Trend</h3>
          <TrendChart
            data={marginData}
            xKey="period"
            series={[
              { key: "Gross Margin", label: "Gross Margin", color: CHART_COLORS[0] },
              { key: "Operating Margin", label: "Operating Margin", color: CHART_COLORS[2] },
              { key: "Net Margin", label: "Net Margin", color: CHART_COLORS[3] },
            ]}
            valueFormatter={(v) => `${v.toFixed(1)}%`}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">EPS Trend</h3>
          <TrendChart
            data={epsData}
            xKey="period"
            series={[
              { key: "Basic EPS", label: "Basic EPS", color: CHART_COLORS[0] },
              { key: "Diluted EPS", label: "Diluted EPS", color: CHART_COLORS[4] },
            ]}
            valueFormatter={(v) => `₹${v.toFixed(2)}`}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Where the Revenue Went · {latest.periodLabel}</h3>
          <CompositionBars rows={compositionRows} total={revenue} />
        </div>
      </div>
    </div>
  );
}

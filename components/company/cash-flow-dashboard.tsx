import { TrendChart } from "@/components/charts/trend-chart";
import { KpiStat } from "@/components/company/kpi-stat";
import { formatCr } from "@/lib/format";
import { CHART_COLORS } from "@/lib/colors";

interface CashFlowPeriod {
  periodLabel: string;
  periodType?: "annual" | "quarterly";
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  freeCashFlow?: number;
  capitalExpenditure?: number;
  endCashPosition?: number;
  beginningCashPosition?: number;
}

function pctChange(current?: number | null, previous?: number | null): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function CashFlowDashboard({ statements }: { statements: CashFlowPeriod[] }) {
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
    "Operating CF": s.operatingCashFlow ?? null,
    "Investing CF": s.investingCashFlow ?? null,
    "Financing CF": s.financingCashFlow ?? null,
  }));

  const fcfData = statementsForTrend.map((s) => ({
    period: s.periodLabel,
    "Free Cash Flow": s.freeCashFlow ?? null,
  }));

  const capexData = statementsForTrend.map((s) => ({
    period: s.periodLabel,
    "Capital Expenditure": s.capitalExpenditure != null ? Math.abs(s.capitalExpenditure) : null,
  }));

  const cashPositionData = statementsForTrend.map((s) => ({
    period: s.periodLabel,
    "Beginning Cash": s.beginningCashPosition ?? null,
    "Ending Cash": s.endCashPosition ?? null,
  }));

  const latestCapex = latest.capitalExpenditure != null ? Math.abs(latest.capitalExpenditure) : undefined;
  const previousCapex = previous?.capitalExpenditure != null ? Math.abs(previous.capitalExpenditure) : undefined;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Latest period · {latest.periodLabel}</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiStat
            label="Operating Cash Flow"
            value={formatCr((latest.operatingCashFlow ?? 0) / 1e7)}
            delta={pctChange(latest.operatingCashFlow, previous?.operatingCashFlow)}
          />
          <KpiStat
            label="Free Cash Flow"
            value={formatCr((latest.freeCashFlow ?? 0) / 1e7)}
            delta={pctChange(latest.freeCashFlow, previous?.freeCashFlow)}
          />
          <KpiStat
            label="Capital Expenditure"
            value={formatCr((latestCapex ?? 0) / 1e7)}
            delta={pctChange(latestCapex, previousCapex)}
            neutral
          />
          <KpiStat
            label="Ending Cash Position"
            value={formatCr((latest.endCashPosition ?? 0) / 1e7)}
            delta={pctChange(latest.endCashPosition, previous?.endCashPosition)}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Operating, Investing & Financing Cash Flow</h3>
          <TrendChart
            data={trendData}
            xKey="period"
            series={[
              { key: "Operating CF", label: "Operating CF", color: CHART_COLORS[0] },
              { key: "Investing CF", label: "Investing CF", color: CHART_COLORS[2] },
              { key: "Financing CF", label: "Financing CF", color: CHART_COLORS[5] },
            ]}
            valueFormatter={(v) => formatCr(v / 1e7)}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Free Cash Flow</h3>
          <TrendChart
            data={fcfData}
            xKey="period"
            series={[{ key: "Free Cash Flow", label: "Free Cash Flow", color: CHART_COLORS[3] }]}
            valueFormatter={(v) => formatCr(v / 1e7)}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Capital Expenditure</h3>
          <TrendChart
            data={capexData}
            xKey="period"
            series={[{ key: "Capital Expenditure", label: "Capital Expenditure", color: CHART_COLORS[7] }]}
            valueFormatter={(v) => formatCr(v / 1e7)}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-foreground">Cash Position</h3>
          <TrendChart
            data={cashPositionData}
            xKey="period"
            series={[
              { key: "Beginning Cash", label: "Beginning Cash", color: CHART_COLORS[4] },
              { key: "Ending Cash", label: "Ending Cash", color: CHART_COLORS[0] },
            ]}
            valueFormatter={(v) => formatCr(v / 1e7)}
          />
        </div>
      </div>
    </div>
  );
}

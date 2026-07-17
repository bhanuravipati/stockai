"use client";

import { use } from "react";
import useSWR from "swr";
import { formatPercent, formatINR, formatCr, formatRelativeDate } from "@/lib/format";
import { fetcher, extractErrorMessage } from "@/lib/swr-fetcher";
import { Skeleton } from "@/components/ui/skeleton";

interface Ratios {
  peRatio?: number;
  priceToBook?: number;
  pegRatio?: number;
  beta?: number;
  debtToEquity?: number;
  roe?: number;
  roa?: number;
  currentRatio?: number;
  quickRatio?: number;
  profitMargin?: number;
  operatingMargin?: number;
  targetHighPrice?: number;
  targetLowPrice?: number;
  targetMeanPrice?: number;
  recommendationKey?: string;
  recommendationMean?: number;
  numberOfAnalystOpinions?: number;
  dividendRate?: number;
  dividendYield?: number;
  payoutRatio?: number;
  exDividendDate?: string;
  earningsGrowth?: number;
  revenueGrowth?: number;
  freeCashflow?: number;
  operatingCashflow?: number;
  totalCash?: number;
  totalDebt?: number;
}

interface RatioItem {
  label: string;
  value: number | null | undefined;
  format: "number" | "percent";
  description: string;
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  strong_buy: "Strong Buy",
  buy: "Buy",
  hold: "Hold",
  underperform: "Underperform",
  sell: "Sell",
};

interface RatiosResponse {
  ratios: Ratios;
}

export default function RatiosPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = use(params);
  const { data, error, isLoading } = useSWR<RatiosResponse>(`/api/companies/${symbol}/ratios`, fetcher);
  const ratios = data?.ratios;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Financial Ratios</h2>
        <p className="text-muted-foreground">{extractErrorMessage(error, "Failed to fetch ratios")}</p>
      </div>
    );
  }

  // Yahoo returns ROE/ROA/margins/growth/dividend-yield/payout-ratio as raw
  // fractions (0.09139 = 9.14%) — multiply by 100 before formatPercent,
  // which just appends "%" to whatever number it's given.
  const asPercent = (v?: number) => (v === null || v === undefined ? v : v * 100);

  const valuationItems: RatioItem[] = [
    { label: "P/E Ratio", value: ratios?.peRatio, format: "number", description: "Price-to-Earnings" },
    { label: "Price to Book", value: ratios?.priceToBook, format: "number", description: "P/B Ratio" },
    { label: "PEG Ratio", value: ratios?.pegRatio, format: "number", description: "P/E-to-growth" },
    { label: "Beta", value: ratios?.beta, format: "number", description: "Volatility vs. market" },
    { label: "Debt to Equity", value: ratios?.debtToEquity, format: "number", description: "Leverage ratio" },
    { label: "ROE", value: asPercent(ratios?.roe), format: "percent", description: "Return on Equity" },
    { label: "ROA", value: asPercent(ratios?.roa), format: "percent", description: "Return on Assets" },
    { label: "Current Ratio", value: ratios?.currentRatio, format: "number", description: "Liquidity" },
    { label: "Quick Ratio", value: ratios?.quickRatio, format: "number", description: "Acid Test" },
    { label: "Profit Margin", value: asPercent(ratios?.profitMargin), format: "percent", description: "Net margin" },
    { label: "Operating Margin", value: asPercent(ratios?.operatingMargin), format: "percent", description: "Operating efficiency" },
  ];

  const growthItems: RatioItem[] = [
    { label: "Earnings Growth", value: asPercent(ratios?.earningsGrowth), format: "percent", description: "YoY earnings growth" },
    { label: "Revenue Growth", value: asPercent(ratios?.revenueGrowth), format: "percent", description: "YoY revenue growth" },
    { label: "Dividend Yield", value: asPercent(ratios?.dividendYield), format: "percent", description: "Annual yield" },
    { label: "Payout Ratio", value: asPercent(ratios?.payoutRatio), format: "percent", description: "% of earnings paid out" },
  ];

  const hasValuationData = valuationItems.some((item) => item.value !== null && item.value !== undefined);
  const hasGrowthData = growthItems.some((item) => item.value !== null && item.value !== undefined);
  const hasAnalystData =
    ratios?.targetMeanPrice != null || ratios?.recommendationKey != null || ratios?.numberOfAnalystOpinions != null;
  const hasCashFlowData =
    ratios?.freeCashflow != null || ratios?.operatingCashflow != null || ratios?.totalCash != null || ratios?.totalDebt != null;
  const hasDividendDetail = ratios?.dividendRate != null || ratios?.exDividendDate != null;

  const hasData = hasValuationData || hasGrowthData || hasAnalystData || hasCashFlowData || hasDividendDetail;

  if (!hasData) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Financial Ratios</h2>
        <p className="text-muted-foreground">No ratio data available for {symbol}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasValuationData && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-6 text-lg font-semibold">Valuation & Ratios</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {valuationItems.map((item) => (
              <div key={item.label} className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">
                  {item.value !== null && item.value !== undefined
                    ? item.format === "percent"
                      ? formatPercent(item.value)
                      : item.value.toFixed(2)
                    : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasAnalystData && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-6 text-lg font-semibold">Analyst Estimates</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Recommendation</p>
              <p className="mt-2 text-2xl font-semibold">
                {ratios?.recommendationKey
                  ? RECOMMENDATION_LABELS[ratios.recommendationKey] ?? ratios.recommendationKey
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {ratios?.numberOfAnalystOpinions ? `${ratios.numberOfAnalystOpinions} analysts` : "Consensus rating"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Target Mean Price</p>
              <p className="mt-2 text-2xl font-semibold">
                {ratios?.targetMeanPrice != null ? formatINR(ratios.targetMeanPrice) : "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Average analyst target</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Target Range</p>
              <p className="mt-2 text-2xl font-semibold">
                {ratios?.targetLowPrice != null && ratios?.targetHighPrice != null
                  ? `${formatINR(ratios.targetLowPrice)} – ${formatINR(ratios.targetHighPrice)}`
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Low – High target</p>
            </div>
          </div>
        </div>
      )}

      {(hasGrowthData || hasDividendDetail) && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-6 text-lg font-semibold">Growth & Dividends</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {growthItems.map((item) => (
              <div key={item.label} className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">
                  {item.value !== null && item.value !== undefined ? formatPercent(item.value) : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
            {hasDividendDetail && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Dividend Rate</p>
                <p className="mt-2 text-2xl font-semibold">
                  {ratios?.dividendRate != null ? formatINR(ratios.dividendRate) : "—"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {ratios?.exDividendDate ? `Ex-date: ${formatRelativeDate(ratios.exDividendDate)}` : "Per share, annualized"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {hasCashFlowData && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-6 text-lg font-semibold">Cash Flow & Balance Sheet</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Free Cash Flow</p>
              <p className="mt-2 text-2xl font-semibold">
                {ratios?.freeCashflow != null ? formatCr(ratios.freeCashflow / 1e7) : "—"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Operating Cash Flow</p>
              <p className="mt-2 text-2xl font-semibold">
                {ratios?.operatingCashflow != null ? formatCr(ratios.operatingCashflow / 1e7) : "—"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Total Cash</p>
              <p className="mt-2 text-2xl font-semibold">
                {ratios?.totalCash != null ? formatCr(ratios.totalCash / 1e7) : "—"}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Total Debt</p>
              <p className="mt-2 text-2xl font-semibold">
                {ratios?.totalDebt != null ? formatCr(ratios.totalDebt / 1e7) : "—"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

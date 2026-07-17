"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, extractErrorMessage } from "@/lib/swr-fetcher";
import { formatINR, formatPercent } from "@/lib/format";
import { gainLossText } from "@/lib/colors";
import { PriceHistoryChart } from "@/components/charts/price-history-chart";
import { TimeframeSelector } from "@/components/charts/timeframe-selector";
import { StatTile } from "@/components/company/stat-tile";
import { ReturnCalculator } from "@/components/company/return-calculator";
import { Skeleton } from "@/components/ui/skeleton";
import { LivePriceDisplay } from "@/components/company/live-price-display";
import type { PriceRange } from "@/lib/price-range";

type PriceBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

interface CompanyResponse {
  company: { symbol: string; name: string; sector?: string; exchange: string };
  quote: {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    dayHigh?: number;
    dayLow?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    totalBuyQuantity?: number | null;
    totalSellQuantity?: number | null;
    upperCircuitLimit?: number | null;
    lowerCircuitLimit?: number | null;
    source?: "angelone" | "yahoo";
  };
  history: PriceBar[];
}

interface RatiosResponse {
  ratios?: {
    peRatio?: number;
    roe?: number;
    roa?: number;
  };
}

interface PriceCagr {
  oneYear?: number;
  threeYear?: number;
  fiveYear?: number;
  tenYear?: number;
  lifetime?: number;
}

interface HistoryResponse {
  history: PriceBar[];
}

export function OverviewClient({ symbol }: { symbol: string }) {
  const [range, setRange] = useState<PriceRange>("1Y");
  const [chartType, setChartType] = useState<"area" | "candle">("area");

  // Reset to the default range whenever the symbol changes (e.g. client-side
  // nav between two company pages without a full unmount, which does NOT
  // reset local state on its own). Adjusting state directly during render
  // when a prop changes — React's own recommended pattern for this exact
  // case — instead of a useEffect, which would need an extra render pass.
  const [prevSymbol, setPrevSymbol] = useState(symbol);
  if (symbol !== prevSymbol) {
    setPrevSymbol(symbol);
    setRange("1Y");
  }

  const {
    data: companyData,
    error: companyError,
    isLoading: companyLoading,
  } = useSWR<CompanyResponse>(`/api/companies/${symbol}`, fetcher);
  const { data: ratiosData } = useSWR<RatiosResponse>(`/api/companies/${symbol}/ratios`, fetcher);
  const { data: cagrData } = useSWR<{ cagr?: PriceCagr }>(`/api/companies/${symbol}/cagr`, fetcher);
  // "1Y" is already included in the combined company fetch above — only hit
  // the dedicated history endpoint for other ranges. SWR caches each range
  // by URL, so flipping back to an already-viewed range is instant.
  const { data: rangeData, isLoading: rangeLoading } = useSWR<HistoryResponse>(
    range !== "1Y" ? `/api/companies/${symbol}/history?range=${range}` : null,
    fetcher
  );

  if (companyLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (companyError || !companyData) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        {companyError ? extractErrorMessage(companyError, "Failed to fetch company data") : "Failed to load data"}
      </div>
    );
  }

  const { quote } = companyData;
  const ratios = ratiosData?.ratios;
  const cagr = cagrData?.cagr ?? null;
  const chartHistory = range === "1Y" ? companyData.history ?? [] : rangeData?.history ?? [];
  const chartLoading = range !== "1Y" && rangeLoading;

  const rangeFirst = chartHistory[0];
  const rangeLast = chartHistory[chartHistory.length - 1];
  const rangeChange = rangeFirst && rangeLast ? rangeLast.close - rangeFirst.close : null;
  const rangeChangePercent =
    rangeFirst && rangeLast && rangeFirst.close !== 0
      ? (rangeChange! / rangeFirst.close) * 100
      : null;
  const rangeIsPositive = (rangeChange ?? 0) >= 0;

  return (
    <div className="space-y-6">
      <LivePriceDisplay symbol={symbol} quote={quote} />

      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile
          label="P/E Ratio"
          value={ratios?.peRatio ? ratios.peRatio.toFixed(2) : "—"}
        />
        <StatTile label="52W High" value={formatINR(quote.fiftyTwoWeekHigh || 0)} />
        <StatTile label="52W Low" value={formatINR(quote.fiftyTwoWeekLow || 0)} />
        <StatTile label="Day High" value={formatINR(quote.dayHigh || 0)} />
      </div>

      {/* Price Chart */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Price Chart</h3>
            {rangeChangePercent !== null && (
              <div className={`mt-1 text-sm font-medium tabular-nums ${gainLossText(rangeIsPositive)}`}>
                {rangeIsPositive ? "+" : ""}
                {formatINR(rangeChange!)} ({rangeIsPositive ? "+" : ""}
                {formatPercent(rangeChangePercent)}) over selected range
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border bg-muted/30 p-1">
              <button
                type="button"
                onClick={() => setChartType("area")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  chartType === "area" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Line
              </button>
              <button
                type="button"
                onClick={() => setChartType("candle")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  chartType === "candle" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Candlestick
              </button>
            </div>
            <TimeframeSelector value={range} onChange={setRange} disabled={chartLoading} />
          </div>
        </div>

        {chartHistory.length > 0 ? (
          <div className={chartLoading ? "opacity-50 transition-opacity" : "transition-opacity"}>
            <PriceHistoryChart data={chartHistory} range={range} chartType={chartType} />
          </div>
        ) : (
          <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
            {chartLoading ? "Loading…" : "No price data available for this range"}
          </div>
        )}

        {/* Price CAGR — independent of the selected chart range, computed once from full history */}
        {cagr && (cagr.oneYear != null || cagr.threeYear != null || cagr.fiveYear != null || cagr.tenYear != null || cagr.lifetime != null) && (
          <div className="mt-6 border-t pt-4">
            <p className="mb-3 text-xs text-muted-foreground">Price CAGR</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {(
                [
                  ["1Y CAGR", cagr.oneYear],
                  ["3Y CAGR", cagr.threeYear],
                  ["5Y CAGR", cagr.fiveYear],
                  ["10Y CAGR", cagr.tenYear],
                  ["Lifetime CAGR", cagr.lifetime],
                ] as const
              ).map(([label, value]) => (
                <StatTile
                  key={label}
                  label={label}
                  value={value != null ? formatPercent(value) : "—"}
                  valueClassName={value != null ? gainLossText(value) : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Investment Return Calculator — driven by the same CAGR data as the tiles above */}
      {cagr && (cagr.oneYear != null || cagr.threeYear != null || cagr.fiveYear != null || cagr.tenYear != null || cagr.lifetime != null) && (
        <ReturnCalculator cagr={cagr} symbol={symbol} />
      )}

      {/* Additional Metrics */}
      {ratios && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatTile
            label="ROE"
            value={ratios.roe ? formatPercent(ratios.roe * 100) : "—"}
          />
          <StatTile
            label="ROA"
            value={ratios.roa ? formatPercent(ratios.roa * 100) : "—"}
          />
        </div>
      )}
    </div>
  );
}

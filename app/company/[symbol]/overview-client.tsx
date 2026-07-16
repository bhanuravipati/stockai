"use client";

import { useEffect, useRef, useState } from "react";
import { formatINR, formatPercent, formatCompact } from "@/lib/format";
import { gainLossText, gainLossBg } from "@/lib/colors";
import { PriceHistoryChart } from "@/components/charts/price-history-chart";
import { BarComparisonChart } from "@/components/charts/bar-comparison-chart";
import { TimeframeSelector } from "@/components/charts/timeframe-selector";
import { StatTile } from "@/components/company/stat-tile";
import { ReturnCalculator } from "@/components/company/return-calculator";
import { Skeleton } from "@/components/ui/skeleton";
import { DemandSupplyGauge } from "@/components/company/demand-supply-gauge";
import { CircuitBadge } from "@/components/company/circuit-badge";
import { useLiveQuote } from "@/lib/hooks/use-live-quote";
import type { PriceRange } from "@/lib/price-range";

interface CompanyData {
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
  history: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
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

export function OverviewClient({ symbol }: { symbol: string }) {
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tick: liveTick, connected: isLive } = useLiveQuote(symbol);

  const [cagr, setCagr] = useState<PriceCagr | null>(null);

  const [range, setRange] = useState<PriceRange>("1Y");
  const [chartHistory, setChartHistory] = useState<CompanyData["history"]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartType, setChartType] = useState<"area" | "candle">("area");
  // Per-range cache so flipping back to an already-fetched range (including
  // the initial "1Y" load) doesn't re-hit the API.
  const historyCache = useRef<Partial<Record<PriceRange, CompanyData["history"]>>>({});

  useEffect(() => {
    historyCache.current = {};

    async function fetchData() {
      try {
        const [companyRes, ratiosRes] = await Promise.all([
          fetch(`/api/companies/${symbol}`),
          fetch(`/api/companies/${symbol}/ratios`),
        ]);

        if (!companyRes.ok) throw new Error("Failed to fetch company data");
        const json = await companyRes.json();

        historyCache.current["1Y"] = json.history || [];
        setChartHistory(json.history || []);

        if (ratiosRes.ok) {
          const ratiosData = await ratiosRes.json();
          setData({ ...json, ratios: ratiosData.ratios });
        } else {
          setData(json);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    setRange("1Y");
    fetchData();
  }, [symbol]);

  useEffect(() => {
    setCagr(null);
    let cancelled = false;

    async function fetchCagr() {
      try {
        const res = await fetch(`/api/companies/${symbol}/cagr`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setCagr(json.cagr || {});
      } catch {
        // CAGR tiles just stay hidden if this fails — non-critical.
      }
    }

    fetchCagr();
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  useEffect(() => {
    // The initial combined fetch above always populates "1Y" — no need to
    // hit the dedicated endpoint for it, just restore it from cache.
    if (range === "1Y") {
      if (historyCache.current["1Y"]) setChartHistory(historyCache.current["1Y"]!);
      return;
    }

    const cached = historyCache.current[range];
    if (cached) {
      setChartHistory(cached);
      return;
    }

    let cancelled = false;
    async function fetchRange() {
      setChartLoading(true);
      try {
        const res = await fetch(`/api/companies/${symbol}/history?range=${range}`);
        if (!res.ok) throw new Error("Failed to fetch history");
        const json = await res.json();
        if (!cancelled) {
          historyCache.current[range] = json.history || [];
          setChartHistory(json.history || []);
        }
      } catch {
        // Keep showing the previous range's data rather than blanking the chart.
      } finally {
        if (!cancelled) setChartLoading(false);
      }
    }

    fetchRange();
    return () => {
      cancelled = true;
    };
  }, [symbol, range]);

  if (loading) {
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

  if (error || !data) {
    return <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">{error || "Failed to load data"}</div>;
  }

  const { quote } = data;
  // Live SSE ticks (when connected) override the static fetch — degrades
  // to the original static `quote` fields whenever no live tick has
  // arrived yet, so this is purely additive to the existing page.
  const hasLiveTick = isLive && liveTick?.price != null;
  const displayPrice = hasLiveTick ? liveTick!.price! : quote.price;
  const displayChange = hasLiveTick && liveTick!.change != null ? liveTick!.change! : quote.change;
  const displayChangePercent =
    hasLiveTick && liveTick!.changePercent != null ? liveTick!.changePercent! : quote.changePercent;
  const displayBuyQty = hasLiveTick ? liveTick!.totalBuyQuantity : quote.totalBuyQuantity;
  const displaySellQty = hasLiveTick ? liveTick!.totalSellQuantity : quote.totalSellQuantity;
  const displayUpperCircuit = hasLiveTick ? liveTick!.upperCircuitLimit : quote.upperCircuitLimit;
  const displayLowerCircuit = hasLiveTick ? liveTick!.lowerCircuitLimit : quote.lowerCircuitLimit;
  const isPositive = displayChange >= 0;

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
      {/* Price Display */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">Current Price</div>
              {hasLiveTick && (
                <span className="flex items-center gap-1 text-xs font-medium text-gain">
                  <span className="size-1.5 animate-pulse rounded-full bg-gain" />
                  LIVE
                </span>
              )}
              <CircuitBadge
                price={displayPrice}
                upperCircuitLimit={displayUpperCircuit}
                lowerCircuitLimit={displayLowerCircuit}
              />
            </div>
            <div className="text-4xl font-bold tabular-nums">{formatINR(displayPrice)}</div>
          </div>
          <div className={`text-right ${gainLossText(isPositive)}`}>
            <div className="text-2xl font-bold tabular-nums">
              {isPositive ? "+" : ""}{formatINR(displayChange)}
            </div>
            <div className="text-lg font-medium tabular-nums">
              {isPositive ? "+" : ""}{formatPercent(displayChangePercent)}
            </div>
          </div>
        </div>
      </div>

      {/* Live demand/supply imbalance — only present when Angel One is streaming this symbol */}
      <DemandSupplyGauge
        totalBuyQuantity={displayBuyQty}
        totalSellQuantity={displaySellQty}
      />

      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile
          label="P/E Ratio"
          value={data.ratios?.peRatio ? data.ratios.peRatio.toFixed(2) : "—"}
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
      {data.ratios && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatTile
            label="ROE"
            value={data.ratios.roe ? formatPercent(data.ratios.roe * 100) : "—"}
          />
          <StatTile
            label="ROA"
            value={data.ratios.roa ? formatPercent(data.ratios.roa * 100) : "—"}
          />
        </div>
      )}
    </div>
  );
}

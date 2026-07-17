"use client";

import { formatINR, formatPercent } from "@/lib/format";
import { gainLossText } from "@/lib/colors";
import { CircuitBadge } from "@/components/company/circuit-badge";
import { DemandSupplyGauge } from "@/components/company/demand-supply-gauge";
import { useLiveQuote } from "@/lib/hooks/use-live-quote";

interface StaticQuote {
  price: number;
  change: number;
  changePercent: number;
  totalBuyQuantity?: number | null;
  totalSellQuantity?: number | null;
  upperCircuitLimit?: number | null;
  lowerCircuitLimit?: number | null;
}

/**
 * Owns the live SSE subscription (`useLiveQuote`), which can tick every
 * 1-3s during market hours. Kept as its own component — separate from the
 * rest of the Overview tab (chart, stat tiles, CAGR, return calculator) —
 * so a tick only re-renders this price strip, not the whole tab.
 */
export function LivePriceDisplay({ symbol, quote }: { symbol: string; quote: StaticQuote }) {
  const { tick: liveTick, connected: isLive } = useLiveQuote(symbol);

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

  return (
    <>
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
    </>
  );
}

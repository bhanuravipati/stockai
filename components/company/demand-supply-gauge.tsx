/** Buy-vs-sell order quantity imbalance, from Angel One's live SNAP_QUOTE feed. Renders nothing when not streaming. */
export function DemandSupplyGauge({
  totalBuyQuantity,
  totalSellQuantity,
}: {
  totalBuyQuantity?: number | null;
  totalSellQuantity?: number | null;
}) {
  if (totalBuyQuantity == null || totalSellQuantity == null) return null;
  const total = totalBuyQuantity + totalSellQuantity;
  if (total <= 0) return null;

  const buyPct = (totalBuyQuantity / total) * 100;
  const sellPct = 100 - buyPct;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Buy Quantity</span>
        <span>Sell Quantity</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className="bg-gain" style={{ width: `${buyPct}%` }} />
        <div className="bg-loss" style={{ width: `${sellPct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm font-medium tabular-nums">
        <span className="text-gain">{buyPct.toFixed(0)}%</span>
        <span className="text-loss">{sellPct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

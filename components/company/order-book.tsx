import { formatINR, formatNumber } from "@/lib/format";

export interface OrderBookLevel {
  price: number;
  quantity: number;
  orders: number;
}

/** Level-2 bid/ask ladder (best 5 levels each side) from Angel One's live SNAP_QUOTE feed. */
export function OrderBook({
  bids,
  asks,
}: {
  bids?: OrderBookLevel[] | null;
  asks?: OrderBookLevel[] | null;
}) {
  if (!bids?.length && !asks?.length) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground">
          Market depth is only available while this symbol is being live-streamed.
        </p>
      </div>
    );
  }

  const sortedBids = [...(bids ?? [])].sort((a, b) => b.price - a.price);
  const sortedAsks = [...(asks ?? [])].sort((a, b) => a.price - b.price);
  const rowCount = Math.max(sortedBids.length, sortedAsks.length, 5);

  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="mb-6 text-lg font-semibold">Market Depth</h2>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="mb-2 grid grid-cols-3 text-xs font-semibold text-muted-foreground">
            <span>Orders</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Bid</span>
          </div>
          <div className="space-y-1">
            {Array.from({ length: rowCount }).map((_, i) => {
              const level = sortedBids[i];
              return (
                <div key={i} className="grid grid-cols-3 rounded bg-gain/5 px-1 py-1 text-sm tabular-nums">
                  <span className="text-muted-foreground">{level ? formatNumber(level.orders) : "—"}</span>
                  <span className="text-center">{level ? formatNumber(level.quantity) : "—"}</span>
                  <span className="text-right font-medium text-gain">{level ? formatINR(level.price) : "—"}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="mb-2 grid grid-cols-3 text-xs font-semibold text-muted-foreground">
            <span>Ask</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Orders</span>
          </div>
          <div className="space-y-1">
            {Array.from({ length: rowCount }).map((_, i) => {
              const level = sortedAsks[i];
              return (
                <div key={i} className="grid grid-cols-3 rounded bg-loss/5 px-1 py-1 text-sm tabular-nums">
                  <span className="font-medium text-loss">{level ? formatINR(level.price) : "—"}</span>
                  <span className="text-center">{level ? formatNumber(level.quantity) : "—"}</span>
                  <span className="text-right text-muted-foreground">{level ? formatNumber(level.orders) : "—"}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

export interface LiveTick {
  price: number | null;
  change: number | null;
  changePercent: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  totalBuyQuantity: number | null;
  totalSellQuantity: number | null;
  upperCircuitLimit: number | null;
  lowerCircuitLimit: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  bestBids: Array<{ price: number; quantity: number; orders: number }> | null;
  bestAsks: Array<{ price: number; quantity: number; orders: number }> | null;
}

/**
 * Opens an SSE connection to /api/companies/{symbol}/live for real-time
 * Angel One ticks. Degrades silently — returns `tick: null` and
 * `connected: false` whenever the stream isn't available (ai-service down,
 * Angel One disabled, symbol not subscribed) so callers should keep
 * showing whatever static quote they already have rather than treat this
 * as an error state.
 */
export function useLiveQuote(symbol: string) {
  const [tick, setTick] = useState<LiveTick | null>(null);
  const [connected, setConnected] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setTick(null);
    setConnected(false);

    const source = new EventSource(`/api/companies/${symbol}/live`);
    sourceRef.current = source;

    source.onopen = () => setConnected(true);

    source.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        const price = raw.price ?? null;
        const closePrice = raw.closePrice ?? null;
        const change = price != null && closePrice ? price - closePrice : null;
        const changePercent = change != null && closePrice ? (change / closePrice) * 100 : null;

        setTick({
          price,
          change,
          changePercent,
          dayHigh: raw.dayHigh ?? null,
          dayLow: raw.dayLow ?? null,
          volume: raw.volume ?? null,
          totalBuyQuantity: raw.totalBuyQuantity ?? null,
          totalSellQuantity: raw.totalSellQuantity ?? null,
          upperCircuitLimit: raw.upperCircuitLimit ?? null,
          lowerCircuitLimit: raw.lowerCircuitLimit ?? null,
          fiftyTwoWeekHigh: raw.fiftyTwoWeekHigh ?? null,
          fiftyTwoWeekLow: raw.fiftyTwoWeekLow ?? null,
          bestBids: raw.bestBids ?? null,
          bestAsks: raw.bestAsks ?? null,
        });
      } catch {
        // Malformed tick — ignore, keep showing the last-known good value.
      }
    };

    source.onerror = () => {
      // EventSource auto-retries on transient errors; if the endpoint 404s
      // (not streaming) the browser stops retrying on its own. Either way,
      // just mark disconnected — never surface this as a page-level error.
      setConnected(false);
    };

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [symbol]);

  return { tick, connected };
}

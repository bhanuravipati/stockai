"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/swr-fetcher";
import { PeRatioExplorer } from "./pe-ratio-explorer";
import type { LearnMetricRow } from "@/app/api/learn/metrics/route";

const SYMBOLS = ["RELIANCE", "TCS", "INFY", "HDFCBANK"];

export function RealPeLookup() {
  const { data } = useSWR<{ results: LearnMetricRow[] }>(
    `/api/learn/metrics?symbols=${SYMBOLS.join(",")}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const usable = (data?.results ?? []).filter((r) => r.price && r.trailingEps && r.trailingEps > 0);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  if (usable.length === 0) {
    // No live snapshot data yet (fresh checkout, empty table, or fetch failed) — fall back silently.
    return <PeRatioExplorer />;
  }

  const selected = usable.find((r) => r.symbol === selectedSymbol) ?? usable[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {usable.map((row) => (
          <Button
            key={row.symbol}
            size="sm"
            variant={row.symbol === selected.symbol ? "default" : "outline"}
            onClick={() => setSelectedSymbol(row.symbol)}
          >
            {row.symbol}
          </Button>
        ))}
      </div>
      <PeRatioExplorer
        key={selected.symbol}
        label={selected.name}
        initialPrice={Math.round(selected.price!)}
        initialEps={Math.round(selected.trailingEps! * 100) / 100}
      />
    </div>
  );
}

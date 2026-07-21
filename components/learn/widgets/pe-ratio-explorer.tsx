"use client";

import { useState } from "react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LabeledSlider } from "./labeled-slider";

interface PeRatioExplorerProps {
  label?: string;
  initialPrice?: number;
  initialEps?: number;
  cheapBelow?: number;
  expensiveAbove?: number;
}

function verdictFor(pe: number, cheapBelow: number, expensiveAbove: number) {
  if (pe <= 0) return { text: "N/A — no earnings", tone: "text-muted-foreground" };
  if (pe < cheapBelow) return { text: "Cheap", tone: "text-gain" };
  if (pe > expensiveAbove) return { text: "Expensive", tone: "text-loss" };
  return { text: "Fair value", tone: "text-chart-3" };
}

export function PeRatioExplorer({
  label = "This company",
  initialPrice = 500,
  initialEps = 25,
  cheapBelow = 15,
  expensiveAbove = 30,
}: PeRatioExplorerProps) {
  const [price, setPrice] = useState(initialPrice);
  const [eps, setEps] = useState(initialEps);
  const pe = eps > 0 ? price / eps : 0;
  const verdict = verdictFor(pe, cheapBelow, expensiveAbove);
  const gaugePercent = Math.min(100, (pe / (expensiveAbove * 1.5)) * 100);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        {label}&apos;s share price is <strong className="text-foreground">{formatINR(price)}</strong> and it earned{" "}
        <strong className="text-foreground">{formatINR(eps)}</strong> per share over the last year. Adjust either
        number to see how the P/E ratio reacts.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <LabeledSlider label="Share price" value={price} min={10} max={2000} step={10} formatValue={formatINR} onValueChange={setPrice} />
        <LabeledSlider label="Earnings per share (EPS)" value={eps} min={1} max={100} step={1} formatValue={formatINR} onValueChange={setEps} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">P/E ratio = price ÷ EPS</span>
          <span className="text-lg font-semibold tabular-nums">{pe.toFixed(1)}x</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-gradient-to-r from-gain via-chart-3 to-loss">
          <div
            className="absolute top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow"
            style={{ left: `${gaugePercent}%`, transform: "translate(-50%, -50%)" }}
          />
        </div>
        <p className={cn("text-sm font-medium", verdict.tone)}>{verdict.text}</p>
      </div>
    </div>
  );
}

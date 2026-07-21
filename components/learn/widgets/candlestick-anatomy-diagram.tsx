"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const HIGH_Y = 20;
const LOW_Y = 200;
const BODY_TOP_Y = 70;
const BODY_BOTTOM_Y = 140;
const WICK_X = 100;
const BODY_X = 70;
const BODY_WIDTH = 60;

export function CandlestickAnatomyDiagram() {
  const [bullish, setBullish] = useState(true);
  const color = bullish ? "var(--gain)" : "var(--loss)";
  const openY = bullish ? BODY_BOTTOM_Y : BODY_TOP_Y;
  const closeY = bullish ? BODY_TOP_Y : BODY_BOTTOM_Y;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Toggle the candle to see how a bullish and bearish day differ.</p>
        <div className="flex shrink-0 gap-1.5">
          <Button size="sm" variant={bullish ? "default" : "outline"} onClick={() => setBullish(true)}>
            Bullish
          </Button>
          <Button size="sm" variant={!bullish ? "default" : "outline"} onClick={() => setBullish(false)}>
            Bearish
          </Button>
        </div>
      </div>

      <svg viewBox="0 0 320 220" className="mx-auto h-56 w-full max-w-xs" role="img" aria-label={`${bullish ? "Bullish" : "Bearish"} candlestick anatomy`}>
        {/* wick */}
        <line x1={WICK_X} y1={HIGH_Y} x2={WICK_X} y2={LOW_Y} stroke={color} strokeWidth={2} />
        {/* body */}
        <rect
          x={BODY_X}
          y={BODY_TOP_Y}
          width={BODY_WIDTH}
          height={BODY_BOTTOM_Y - BODY_TOP_Y}
          fill={color}
          stroke={color}
          rx={2}
        />

        {/* label ticks */}
        {[
          { y: HIGH_Y, text: "High", value: "the highest price traded" },
          { y: openY, text: "Open", value: "the first price traded" },
          { y: closeY, text: "Close", value: "the last price traded" },
          { y: LOW_Y, text: "Low", value: "the lowest price traded" },
        ].map((point) => (
          <g key={point.text}>
            <line x1={WICK_X + 32} y1={point.y} x2={210} y2={point.y} stroke="var(--border)" strokeDasharray="2 2" />
            <text x={216} y={point.y + 4} fill="var(--foreground)" fontSize={13} fontWeight={600}>
              {point.text}
            </text>
          </g>
        ))}
      </svg>

      <p className="text-center text-xs text-muted-foreground">
        The thin <strong>wick</strong> spans the full range traded (High to Low). The thick{" "}
        <strong>body</strong> spans Open to Close —{" "}
        <span style={{ color: "var(--gain)" }}>green</span> means the price closed higher than it opened,{" "}
        <span style={{ color: "var(--loss)" }}>red</span> means it closed lower.
      </p>
    </div>
  );
}

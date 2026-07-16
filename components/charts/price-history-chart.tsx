"use client";

import {
  Area,
  Bar,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR } from "@/lib/format";
import type { PriceRange } from "@/lib/price-range";

type PricePoint = { date: string; open: number; high: number; low: number; close: number };

const INTRADAY_RANGES: PriceRange[] = ["1D", "1W"];
const YEAR_ONLY_RANGES: PriceRange[] = ["5Y", "10Y", "MAX"];

function axisFormatter(range: PriceRange) {
  if (INTRADAY_RANGES.includes(range)) {
    return (v: string) => new Date(v).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }
  if (YEAR_ONLY_RANGES.includes(range)) {
    return (v: string) => new Date(v).toLocaleDateString("en-IN", { year: "numeric" });
  }
  return (v: string) => new Date(v).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function tooltipLabelFormatter(range: PriceRange) {
  if (INTRADAY_RANGES.includes(range)) {
    return (v: any) =>
      new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  }
  return (v: any) => new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Candlestick body/wick, drawn onto the pixel rect recharts hands the shape
// for the [low, high] range bar — open/close come from the row's payload.
function Candle(props: any) {
  const { x, y, width, height, payload } = props;
  const { open, close, low, high } = payload as PricePoint;
  const isUp = close >= open;
  const color = isUp ? "var(--gain)" : "var(--loss)";
  const span = high - low || 1;
  const valueY = (v: number) => y + height * (1 - (v - low) / span);
  const openY = valueY(open);
  const closeY = valueY(close);
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
  const centerX = x + width / 2;
  const bodyWidth = Math.max(width * 0.6, 2);
  const bodyX = centerX - bodyWidth / 2;

  return (
    <g>
      <line x1={centerX} x2={centerX} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
      <rect x={bodyX} y={bodyTop} width={bodyWidth} height={bodyHeight} fill={color} />
    </g>
  );
}

export function PriceHistoryChart({
  data,
  range,
  chartType,
}: {
  data: PricePoint[];
  range: PriceRange;
  chartType: "area" | "candle";
}) {
  const chartData =
    chartType === "candle" ? data.map((d) => ({ ...d, range: [d.low, d.high] })) : data;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tickFormatter={axisFormatter(range)}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          minTickGap={40}
        />
        <YAxis
          domain={["auto", "auto"]}
          tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={64}
          tickFormatter={(v: number) => `₹${v.toLocaleString("en-IN")}`}
        />
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelFormatter={tooltipLabelFormatter(range)}
          formatter={(value: any, name: any, item: any) => {
            if (chartType === "candle") {
              const p = item.payload as PricePoint;
              return [
                `O ${formatINR(p.open)}  H ${formatINR(p.high)}  L ${formatINR(p.low)}  C ${formatINR(p.close)}`,
                "OHLC",
              ];
            }
            return [formatINR(value), "Close"];
          }}
        />
        {chartType === "area" ? (
          <Area type="monotone" dataKey="close" stroke="var(--chart-1)" strokeWidth={2} fill="url(#priceFill)" />
        ) : (
          <Bar dataKey="range" shape={<Candle />} isAnimationActive={false} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

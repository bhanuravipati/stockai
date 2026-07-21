"use client";

import { CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { CHART_COLORS } from "@/lib/colors";

export interface PeerScatterDatum {
  name: string;
  x: number | null;
  y: number | null;
  isCurrent?: boolean;
  /** Explicit fill color, overriding the current/peer 2-tone scheme below (used by the Compare/Industry per-company palette). */
  color?: string;
}

const CURRENT_COLOR = CHART_COLORS[3];
const PEER_COLOR = CHART_COLORS[0];

/**
 * Metric-vs-metric scatter — one dot per company, X/Y are two different
 * selected metrics (not a dual-y-axis of the same measure, which the app's
 * chart conventions otherwise avoid). Same current/peer 2-tone (Peers tab)
 * or `color` override (Compare/Industry via colorMap) as PeerRankingChart,
 * so a company reads the same color across every chart on the dashboard.
 */
export function PeerScatterChart({
  data,
  xLabel,
  yLabel,
  xFormatter,
  yFormatter,
  currentLabel = "This company",
}: {
  data: PeerScatterDatum[];
  xLabel: string;
  yLabel: string;
  xFormatter: (value: number) => string;
  yFormatter: (value: number) => string;
  currentLabel?: string;
}) {
  const chartData = data.filter(
    (d): d is PeerScatterDatum & { x: number; y: number } => d.x != null && d.y != null
  );

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground">No data available.</p>;
  }

  const hasCurrent = chartData.some((d) => d.isCurrent);

  return (
    <div>
      {hasCurrent && (
        <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: CURRENT_COLOR }} aria-hidden />
            {currentLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: PEER_COLOR }} aria-hidden />
            Peers
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            tickFormatter={(v: number) => xFormatter(v)}
            label={{ value: xLabel, position: "insideBottom", offset: -16, fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={64}
            tickFormatter={(v: number) => yFormatter(v)}
            label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          {/* Fixed range keeps every dot the same size — this scatter has no third (bubble-size) metric. */}
          <ZAxis range={[80, 80]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "var(--border)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, name) => [name === xLabel ? xFormatter(Number(value)) : yFormatter(Number(value)), name]}
            labelFormatter={(_, payload) => (payload?.[0]?.payload as PeerScatterDatum | undefined)?.name ?? ""}
          />
          <Scatter data={chartData}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.color ?? (d.isCurrent ? CURRENT_COLOR : PEER_COLOR)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "@/lib/colors";

export interface PeerRankingDatum {
  name: string;
  value: number | null;
  isCurrent?: boolean;
}

const CURRENT_COLOR = CHART_COLORS[3];
const PEER_COLOR = CHART_COLORS[0];

export function PeerRankingChart({
  data,
  valueFormatter,
  currentLabel = "This company",
}: {
  data: PeerRankingDatum[];
  valueFormatter: (value: number) => string;
  currentLabel?: string;
}) {
  const chartData = data.filter((d): d is PeerRankingDatum & { value: number } => d.value != null);

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground">No data available.</p>;
  }

  return (
    <div>
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
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={64}
            tickFormatter={(v: number) => valueFormatter(v)}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => [valueFormatter(Number(value)), "Value"]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.isCurrent ? CURRENT_COLOR : PEER_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

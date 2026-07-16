"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS } from "@/lib/colors";

export interface PeerShareDatum {
  name: string;
  value: number;
  isCurrent?: boolean;
}

const CURRENT_COLOR = CHART_COLORS[3];

export function PeerShareChart({
  data,
  valueFormatter,
}: {
  data: PeerShareDatum[];
  valueFormatter: (value: number) => string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (data.length === 0 || total <= 0) {
    return <p className="text-sm text-muted-foreground">No data available.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {data.map((d, i) => (
            <Cell
              key={d.name}
              fill={d.isCurrent ? CURRENT_COLOR : CHART_COLORS[i % CHART_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value, name) => {
            const v = Number(value);
            return [`${valueFormatter(v)} (${((v / total) * 100).toFixed(1)}%)`, name];
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

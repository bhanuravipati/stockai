"use client";

import { useMemo, useState } from "react";
import { TrendChart } from "@/components/charts/trend-chart";
import { CHART_COLORS } from "@/lib/colors";
import { formatINR } from "@/lib/format";
import { LabeledSlider } from "./labeled-slider";

interface SupplyDemandPriceWidgetProps {
  basePrice?: number;
}

const TICKS = 10;

export function SupplyDemandPriceWidget({ basePrice = 500 }: SupplyDemandPriceWidgetProps) {
  const [pressure, setPressure] = useState(0);

  const data = useMemo(
    () =>
      Array.from({ length: TICKS }, (_, t) => ({
        tick: `T${t}`,
        price: Math.round(basePrice * (1 + (pressure / 200) * t)),
      })),
    [basePrice, pressure],
  );

  const finalPrice = data[data.length - 1].price;
  const direction = pressure > 0 ? "risen" : pressure < 0 ? "fallen" : "stayed flat";

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        A stock starts trading at <strong className="text-foreground">{formatINR(basePrice)}</strong>. Drag the
        slider to tilt the balance of buyers vs. sellers and watch what happens to the price over the next few
        trades.
      </p>
      <LabeledSlider
        label="Buy pressure (more buyers) vs. sell pressure (more sellers)"
        value={pressure}
        min={-10}
        max={10}
        step={1}
        formatValue={(v) => (v > 0 ? `+${v} buyers` : v < 0 ? `${v} sellers` : "balanced")}
        onValueChange={setPressure}
      />
      <p className="text-sm">
        With demand and supply out of balance like this, the price has <strong className="text-primary">{direction}</strong> to{" "}
        <strong className="text-primary">{formatINR(finalPrice)}</strong>.
      </p>
      <TrendChart data={data} xKey="tick" series={[{ key: "price", label: "Price", color: CHART_COLORS[0] }]} valueFormatter={formatINR} />
    </div>
  );
}

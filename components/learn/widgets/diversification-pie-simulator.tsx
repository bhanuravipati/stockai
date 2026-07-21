"use client";

import { useMemo, useState } from "react";
import { PeerShareChart } from "@/components/company/peer-share-chart";
import { Badge } from "@/components/ui/badge";
import { CHART_COLORS } from "@/lib/colors";
import { LabeledSlider } from "./labeled-slider";

const SECTORS = ["Technology", "Financials", "Energy", "Healthcare", "Consumer"];

export function DiversificationPieSimulator() {
  const [allocations, setAllocations] = useState<number[]>([60, 10, 10, 10, 10]);

  const total = allocations.reduce((sum, v) => sum + v, 0) || 1;
  const shares = allocations.map((v) => v / total);
  const maxShare = Math.max(...shares);
  const activeSectors = shares.filter((s) => s > 0.02).length;

  const risk = useMemo(() => {
    if (maxShare >= 0.5) return { label: "Concentrated — one bet decides your outcome", tone: "destructive" as const };
    if (maxShare <= 0.35 && activeSectors >= 4) return { label: "Well diversified", tone: "secondary" as const };
    return { label: "Moderately diversified", tone: "outline" as const };
  }, [maxShare, activeSectors]);

  function updateSector(index: number, value: number) {
    setAllocations((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        Split a portfolio across five sectors. Watch how concentrating in one sector changes the risk read-out.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {SECTORS.map((sector, i) => (
          <LabeledSlider
            key={sector}
            label={sector}
            value={allocations[i]}
            min={0}
            max={100}
            step={5}
            formatValue={(v) => `${Math.round((v / total) * 100)}%`}
            onValueChange={(value) => updateSector(i, value)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Badge variant={risk.tone}>{risk.label}</Badge>
      </div>

      <PeerShareChart
        data={SECTORS.map((sector, i) => ({ name: sector, value: allocations[i], color: CHART_COLORS[i] }))}
        valueFormatter={(v) => `${Math.round((v / total) * 100)}%`}
      />
    </div>
  );
}

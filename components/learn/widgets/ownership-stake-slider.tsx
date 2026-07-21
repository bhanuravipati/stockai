"use client";

import { useState } from "react";
import { PeerShareChart } from "@/components/company/peer-share-chart";
import { formatNumber } from "@/lib/format";
import { LabeledSlider } from "./labeled-slider";

interface OwnershipStakeSliderProps {
  companyName?: string;
  totalSharesOutstanding?: number;
}

export function OwnershipStakeSlider({
  companyName = "Acme Retail",
  totalSharesOutstanding = 10_000_000,
}: OwnershipStakeSliderProps) {
  const [sharesOwned, setSharesOwned] = useState(50_000);
  const stakePercent = (sharesOwned / totalSharesOutstanding) * 100;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        {companyName} has <strong className="text-foreground">{formatNumber(totalSharesOutstanding)}</strong> shares
        outstanding in total. Drag the slider to choose how many shares you own.
      </p>
      <LabeledSlider
        label="Shares you own"
        value={sharesOwned}
        min={0}
        max={totalSharesOutstanding / 10}
        step={1_000}
        formatValue={formatNumber}
        onValueChange={setSharesOwned}
      />
      <p className="text-sm">
        That makes you the owner of{" "}
        <strong className="text-primary">{stakePercent.toFixed(3)}%</strong> of {companyName}.
      </p>
      <PeerShareChart
        data={[
          { name: "You", value: sharesOwned },
          { name: "Everyone else", value: totalSharesOutstanding - sharesOwned },
        ]}
        valueFormatter={formatNumber}
      />
    </div>
  );
}

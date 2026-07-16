"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { StatTile } from "@/components/company/stat-tile";
import { formatINR, formatPercent } from "@/lib/format";
import { gainLossText } from "@/lib/colors";

interface PriceCagr {
  oneYear?: number;
  threeYear?: number;
  fiveYear?: number;
  tenYear?: number;
  lifetime?: number;
}

type Basis = "1Y" | "3Y" | "5Y" | "10Y" | "lifetime";
type Mode = "historical" | "forecast";

const BASIS_OPTIONS: { key: Basis; label: string; years: number | null }[] = [
  { key: "1Y", label: "1Y CAGR", years: 1 },
  { key: "3Y", label: "3Y CAGR", years: 3 },
  { key: "5Y", label: "5Y CAGR", years: 5 },
  { key: "10Y", label: "10Y CAGR", years: 10 },
  { key: "lifetime", label: "Lifetime CAGR", years: null },
];

const FORECAST_PERIODS = [1, 3, 5, 10];

function basisRate(cagr: PriceCagr, basis: Basis): number | undefined {
  switch (basis) {
    case "1Y":
      return cagr.oneYear;
    case "3Y":
      return cagr.threeYear;
    case "5Y":
      return cagr.fiveYear;
    case "10Y":
      return cagr.tenYear;
    case "lifetime":
      return cagr.lifetime;
  }
}

function ToggleGroup<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            value === opt.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ReturnCalculator({ cagr, symbol }: { cagr: PriceCagr; symbol: string }) {
  const [amount, setAmount] = useState(100000);
  const [mode, setMode] = useState<Mode>("historical");
  const [basis, setBasis] = useState<Basis>("5Y");
  const [forecastYears, setForecastYears] = useState(5);

  const availableBasis = BASIS_OPTIONS.filter(
    (b) => basisRate(cagr, b.key) != null && (mode === "forecast" || b.years != null)
  );
  const effectiveBasis = availableBasis.some((b) => b.key === basis) ? basis : availableBasis[0]?.key;
  const rate = effectiveBasis ? basisRate(cagr, effectiveBasis) : undefined;
  const years = mode === "historical" ? BASIS_OPTIONS.find((b) => b.key === effectiveBasis)?.years ?? 0 : forecastYears;

  const rows = useMemo(() => {
    if (rate == null || !years || amount <= 0) return [];
    const r = rate / 100;
    const out: { year: number; opening: number; growth: number; closing: number; cumulativeReturnPct: number }[] = [];
    let prev = amount;
    for (let y = 1; y <= years; y++) {
      const closing = amount * Math.pow(1 + r, y);
      out.push({
        year: y,
        opening: prev,
        growth: closing - prev,
        closing,
        cumulativeReturnPct: ((closing - amount) / amount) * 100,
      });
      prev = closing;
    }
    return out;
  }, [amount, rate, years]);

  if (!availableBasis.length) return null;

  const finalValue = rows.length ? rows[rows.length - 1].closing : amount;
  const totalReturn = finalValue - amount;
  const totalReturnPct = amount > 0 ? (totalReturn / amount) * 100 : 0;

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold">Investment Return Calculator</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        See how an investment in {symbol} would compound, based on its historical price CAGR.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Investment amount (₹)</label>
          <Input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            className="w-36"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Mode</label>
          <ToggleGroup
            options={[
              { key: "historical" as Mode, label: "Historical" },
              { key: "forecast" as Mode, label: "Forecast" },
            ]}
            value={mode}
            onChange={setMode}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            {mode === "historical" ? "Lookback period" : "Rate basis"}
          </label>
          <ToggleGroup
            options={availableBasis.map((b) => ({ key: b.key, label: b.label }))}
            value={effectiveBasis!}
            onChange={setBasis}
          />
        </div>

        {mode === "forecast" && (
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Forecast period</label>
            <ToggleGroup
              options={FORECAST_PERIODS.map((y) => ({ key: y, label: `${y}Y` }))}
              value={forecastYears}
              onChange={setForecastYears}
            />
          </div>
        )}
      </div>

      {rate != null && years > 0 && rows.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Invested" value={formatINR(amount, { decimals: 0 })} />
            <StatTile
              label={mode === "historical" ? `Value after ${years}Y` : `Projected value (${years}Y)`}
              value={formatINR(finalValue, { decimals: 0 })}
            />
            <StatTile
              label="Total Return"
              value={
                <span className={gainLossText(totalReturn)}>
                  {totalReturn >= 0 ? "+" : ""}
                  {formatINR(totalReturn, { decimals: 0 })}
                </span>
              }
            />
            <StatTile
              label="Total Return %"
              value={<span className={gainLossText(totalReturnPct)}>{formatPercent(totalReturnPct, { signed: true })}</span>}
            />
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Year</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Opening Value</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Growth</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Closing Value</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Cumulative Return</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.year} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">Year {row.year}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatINR(row.opening, { decimals: 0 })}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums ${gainLossText(row.growth)}`}>
                      {row.growth >= 0 ? "+" : ""}
                      {formatINR(row.growth, { decimals: 0 })}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                      {formatINR(row.closing, { decimals: 0 })}
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums ${gainLossText(row.cumulativeReturnPct)}`}>
                      {formatPercent(row.cumulativeReturnPct, { signed: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {mode === "historical"
              ? `Reconstructed from ${symbol}'s actual ${years}-year price CAGR of ${formatPercent(rate)}. `
              : `Assumes ${symbol} continues to grow at its historical ${
                  effectiveBasis === "lifetime" ? "lifetime" : effectiveBasis
                } CAGR of ${formatPercent(rate)} for the next ${years} year${years > 1 ? "s" : ""}. `}
            Past performance does not guarantee future returns — this is an illustrative tool, not investment advice.
          </p>
        </>
      )}
    </div>
  );
}

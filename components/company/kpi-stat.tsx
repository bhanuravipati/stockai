import { StatTile } from "@/components/company/stat-tile";
import { gainLossText } from "@/lib/colors";
import { cn } from "@/lib/utils";

export function KpiStat({
  label,
  value,
  delta,
  invertDelta = false,
  neutral = false,
}: {
  label: string;
  value: string;
  /** Percentage change vs. the prior period, already computed by the caller. */
  delta?: number | null;
  /** Set for metrics where a rise is unfavorable (e.g. liabilities), so the color flips. */
  invertDelta?: boolean;
  /** Set for metrics where direction isn't clearly good/bad (e.g. CapEx) — shows the delta without gain/loss coloring. */
  neutral?: boolean;
}) {
  const showDelta = delta !== null && delta !== undefined && Number.isFinite(delta);

  return (
    <StatTile
      label={label}
      value={
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span>{value}</span>
          {showDelta && (
            <span
              className={cn(
                "text-xs font-medium",
                neutral ? "text-muted-foreground" : gainLossText(invertDelta ? -delta! : delta!)
              )}
            >
              {delta! > 0 ? "▲" : delta! < 0 ? "▼" : "–"} {Math.abs(delta!).toFixed(1)}%
            </span>
          )}
        </div>
      }
    />
  );
}

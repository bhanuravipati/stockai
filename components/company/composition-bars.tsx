import { formatCr } from "@/lib/format";

export interface CompositionRow {
  label: string;
  value: number;
  color: string;
}

/** Part-to-whole breakdown of a single period's total (e.g. revenue split into costs, tax, profit). */
export function CompositionBars({ rows, total }: { rows: CompositionRow[]; total: number }) {
  if (total <= 0) {
    return <p className="text-sm text-muted-foreground">No data available for this period.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const pct = Math.max(0, Math.min(100, (row.value / total) * 100));
        return (
          <div key={row.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                  aria-hidden
                />
                {row.label}
              </span>
              <span className="shrink-0 tabular-nums font-medium text-foreground">
                {formatCr(row.value / 1e7)}{" "}
                <span className="font-normal text-muted-foreground">({pct.toFixed(1)}%)</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: row.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

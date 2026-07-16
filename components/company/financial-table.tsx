import { formatCompact, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export type StatementRow = Record<string, unknown> & { periodLabel: string };

export type RowDef = {
  key: string;
  label: string;
  emphasis?: boolean;
  format?: "cr" | "eps" | "percent" | "shares";
};

function formatValue(raw: unknown, format: RowDef["format"]) {
  if (raw === null || raw === undefined) return "—";
  if (format === "eps") {
    return Number(raw).toFixed(2);
  }
  if (format === "percent") {
    return formatPercent(Number(raw) * 100);
  }
  if (format === "shares") {
    return formatCompact(raw as never);
  }
  // Values come in raw rupees. The table header states the unit ("₹ in Crore")
  // once, so cells show a plain scaled number — no repeated "Cr"/"Lakh Cr" suffix.
  return (Number(raw) / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function FinancialTable({ statements, rows }: { statements: StatementRow[]; rows: RowDef[] }) {
  if (statements.length === 0) {
    return <p className="text-sm text-muted-foreground">No data available for this period.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="sticky left-0 bg-muted/40 px-4 py-3 text-left font-medium text-muted-foreground">
              ₹ in Crore
            </th>
            {statements.map((s) => (
              <th key={s.periodLabel} className="px-4 py-3 text-right font-medium text-muted-foreground whitespace-nowrap">
                {s.periodLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
              <td
                className={cn(
                  "sticky left-0 bg-card px-4 py-2.5 whitespace-nowrap",
                  row.emphasis ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {row.label}
              </td>
              {statements.map((s) => {
                const raw = s[row.key];
                const display = formatValue(raw, row.format);
                return (
                  <td
                    key={s.periodLabel}
                    className={cn(
                      "px-4 py-2.5 text-right tabular-nums whitespace-nowrap",
                      row.emphasis && "font-medium text-foreground"
                    )}
                  >
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

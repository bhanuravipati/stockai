import type { PeerMetrics } from "@/lib/yfinance";

export function CompanyColorLegend({
  companies,
  colorMap,
}: {
  companies: PeerMetrics[];
  colorMap: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {companies.map((c) => (
        <span key={c.symbol} className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: colorMap[c.symbol] }}
            aria-hidden
          />
          {c.name}
        </span>
      ))}
    </div>
  );
}

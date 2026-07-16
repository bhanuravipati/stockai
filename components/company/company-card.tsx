import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatINR, formatPercent } from "@/lib/format";
import { gainLossText } from "@/lib/colors";

type CompanyCardProps = {
  symbol: string;
  name: string;
  sector: string | null;
  price: number | string | null | undefined;
  changePercent: number | string | null | undefined;
};

export function CompanyCard({ symbol, name, sector, price, changePercent }: CompanyCardProps) {
  const pct = Number(changePercent ?? 0);
  const isUp = pct > 0;
  const isDown = pct < 0;

  return (
    <Link
      href={`/company/${symbol}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{name}</div>
          <div className="text-xs text-muted-foreground">{symbol}</div>
        </div>
        {sector && (
          <Badge variant="secondary" className="shrink-0 text-[10px] font-normal">
            {sector}
          </Badge>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-lg font-semibold tabular-nums">
          {price ? formatINR(price) : "—"}
        </span>
        <span className={`flex items-center gap-1 text-sm font-medium tabular-nums ${gainLossText(pct)}`}>
          {isUp && <ArrowUpRight className="size-3.5" />}
          {isDown && <ArrowDownRight className="size-3.5" />}
          {changePercent ? formatPercent(pct, { signed: true }) : "—"}
        </span>
      </div>
    </Link>
  );
}

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCr, formatINR, formatPercent } from "@/lib/format";
import { gainLossText } from "@/lib/colors";

type CompanyHeaderProps = {
  name: string;
  symbol: string;
  sector: string | null;
  exchange: string;
  marketCapCr: number | string | null | undefined;
  price: number | string | null | undefined;
  changeAmount: number | string | null | undefined;
  changePercent: number | string | null | undefined;
};

export function CompanyHeader({
  name,
  symbol,
  sector,
  exchange,
  marketCapCr,
  price,
  changeAmount,
  changePercent,
}: CompanyHeaderProps) {
  const pct = Number(changePercent ?? 0);
  const isUp = pct > 0;
  const isDown = pct < 0;

  return (
    <div className="border-b border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
              <Badge variant="outline">{symbol}</Badge>
              <Badge variant="secondary" className="font-normal">
                {exchange === "BOTH" ? "NSE · BSE" : exchange}
              </Badge>
            </div>
            {sector && <p className="text-sm text-muted-foreground">{sector}</p>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-3xl font-semibold tabular-nums">{formatINR(price)}</span>
            <span className={`flex items-center gap-1 text-sm font-medium tabular-nums ${gainLossText(pct)}`}>
              {isUp && <ArrowUpRight className="size-4" />}
              {isDown && <ArrowDownRight className="size-4" />}
              {formatPercent(changePercent, { signed: true })} ({formatINR(changeAmount)})
            </span>
            <span className="text-xs text-muted-foreground">Mkt Cap {formatCr(marketCapCr)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

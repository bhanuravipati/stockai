import { CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import type { SearchResult } from "./use-company-search";

export function CompanyResultItem({
  company,
  onSelect,
}: {
  company: SearchResult;
  onSelect: (symbol: string) => void;
}) {
  return (
    <CommandItem
      key={company.symbol}
      value={`${company.symbol} ${company.name}`}
      onSelect={() => onSelect(company.symbol)}
      className="items-center justify-between py-2.5"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <TrendingUp className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{company.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {company.symbol}
            {company.sector ? ` · ${company.sector}` : ""}
          </div>
        </div>
      </div>
      <Badge variant="outline" className="shrink-0 text-[10px]">
        {company.exchange === "BOTH" ? "NSE · BSE" : company.exchange}
      </Badge>
    </CommandItem>
  );
}

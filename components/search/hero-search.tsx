"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Command as CommandPrimitive } from "cmdk";
import {
  Command,
  CommandEmpty,
  CommandList,
} from "@/components/ui/command";
import { CompanyResultItem } from "./company-result-item";
import { useCompanySearch } from "./use-company-search";
import { Loader2, Search } from "lucide-react";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { results, loading } = useCompanySearch(query);

  function handleSelect(symbol: string) {
    router.push(`/company/${symbol}`);
  }

  return (
    <Command
      shouldFilter={false}
      className="w-full overflow-visible rounded-2xl border border-border bg-card/60 shadow-2xl shadow-black/20 backdrop-blur"
    >
      <div className="flex items-center gap-3 px-5">
        <Search className="size-5 shrink-0 text-muted-foreground" />
        <CommandPrimitive.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search by company name or symbol — e.g. Reliance, TCS, INFY..."
          className="h-16 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
        />
      </div>
      {query.trim().length > 0 && (
        <CommandList className="max-h-96 border-t border-border">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Searching NSE &amp; BSE...
            </div>
          )}
          {!loading && <CommandEmpty>No companies found for &ldquo;{query}&rdquo;.</CommandEmpty>}
          {results.map((company) => (
            <CompanyResultItem key={company.symbol} company={company} onSelect={handleSelect} />
          ))}
        </CommandList>
      )}
    </Command>
  );
}

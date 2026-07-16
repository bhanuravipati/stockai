"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { CompanyResultItem } from "./company-result-item";
import { useCompanySearch } from "./use-company-search";
import { Search, Loader2 } from "lucide-react";

export function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { results, loading } = useCompanySearch(query);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSelect(symbol: string) {
    setOpen(false);
    setQuery("");
    router.push(`/company/${symbol}`);
  }

  return (
    <>
      <Button
        variant="outline"
        className="h-9 w-full max-w-56 justify-between text-sm text-muted-foreground sm:w-56"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-2">
          <Search className="size-4" />
          Search companies
        </span>
        <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search companies"
        description="Search NSE and BSE listed companies by name or symbol"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search by company name or symbol..."
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Searching...
              </div>
            )}
            {!loading && query.trim().length > 0 && (
              <CommandEmpty>No companies found.</CommandEmpty>
            )}
            {results.map((company) => (
              <CompanyResultItem key={company.symbol} company={company} onSelect={handleSelect} />
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

"use client";

import { useState } from "react";
import { Loader2, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command";
import { CompanyResultItem } from "@/components/search/company-result-item";
import { useCompanySearch } from "@/components/search/use-company-search";

const MAX_COMPANIES = 10;

export function CompanyPickerDialog({
  selectedSymbols,
  onAdd,
}: {
  selectedSymbols: string[];
  onAdd: (symbol: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { results, loading } = useCompanySearch(query);

  const selectedSet = new Set(selectedSymbols);
  const filteredResults = results.filter((r) => !selectedSet.has(r.symbol));
  const atLimit = selectedSymbols.length >= MAX_COMPANIES;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" disabled={atLimit}>
            <PlusIcon />
            {atLimit ? "10 / 10 selected" : "Add company"}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add companies to compare</DialogTitle>
          <DialogDescription>
            Search by company name or symbol. {selectedSymbols.length} / {MAX_COMPANIES} selected.
          </DialogDescription>
        </DialogHeader>

        <Command shouldFilter={false} className="rounded-lg! border">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search NSE and BSE listed companies..."
          />
          <CommandList className="max-h-80">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Searching...
              </div>
            )}
            {!loading && query.trim().length > 0 && filteredResults.length === 0 && (
              <CommandEmpty>No companies found.</CommandEmpty>
            )}
            {!loading &&
              filteredResults.map((company) => (
                <CompanyResultItem
                  key={company.symbol}
                  company={company}
                  onSelect={(symbol) => {
                    if (selectedSymbols.length < MAX_COMPANIES) onAdd(symbol);
                  }}
                />
              ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

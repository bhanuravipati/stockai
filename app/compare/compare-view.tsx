"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LinkIcon, XIcon, GitCompareArrows } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatementSection } from "@/components/company/statement-section";
import { PeerComparisonTable } from "@/components/company/peer-comparison-table";
import { PeerColumnEditor } from "@/components/company/peer-column-editor";
import { CompanyPickerDialog } from "@/components/compare/company-picker-dialog";
import { CompanyColorLegend } from "@/components/compare/company-color-legend";
import { CompareDashboard } from "@/components/compare/compare-dashboard";
import { COMPARE_DEFAULT_COLUMN_KEYS, resolvePeerColumns } from "@/lib/peer-columns";
import { CHART_COLORS } from "@/lib/colors";
import { fetcher, extractErrorMessage } from "@/lib/swr-fetcher";
import type { PeerMetrics } from "@/lib/yfinance";

const MAX_COMPANIES = 10;

function parseSymbolsParam(value: string | null): string[] {
  if (!value) return [];
  return Array.from(new Set(value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)));
}

/** Column keys are case-sensitive camelCase (e.g. "marketCap") — must not be uppercased like symbols. */
function parseColumnsParam(value: string | null): string[] {
  if (!value) return [];
  return Array.from(new Set(value.split(",").map((s) => s.trim()).filter(Boolean)));
}

function sameKeySet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((k) => setB.has(k));
}

interface CompareResponse {
  companies: PeerMetrics[];
  failed: string[];
}

export function CompareView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const symbolsParam = searchParams.get("symbols") ?? "";
  const colsParam = searchParams.get("cols");

  const symbols = useMemo(() => parseSymbolsParam(symbolsParam).slice(0, MAX_COMPANIES), [symbolsParam]);
  const columnKeys = useMemo(
    () => (colsParam ? parseColumnsParam(colsParam) : COMPARE_DEFAULT_COLUMN_KEYS),
    [colsParam]
  );
  const columns = useMemo(() => resolvePeerColumns(columnKeys), [columnKeys]);

  const compareKey =
    symbols.length > 0 ? `/api/companies/compare?symbols=${encodeURIComponent(symbols.join(","))}` : null;
  const { data, error, isLoading } = useSWR<CompareResponse>(compareKey, fetcher, {
    // Driven by explicit add/remove actions via the URL, not ambient
    // staleness — avoid re-toasting the "couldn't load" warning below on
    // every tab-focus revalidation.
    revalidateOnFocus: false,
    onSuccess: (result) => {
      if (result.failed.length > 0) {
        toast.warning(`Couldn't load data for: ${result.failed.join(", ")}`);
      }
    },
  });
  const companies = useMemo(() => data?.companies ?? [], [data]);
  const loading = symbols.length > 0 && isLoading;

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    companies.forEach((c, i) => {
      map[c.symbol] = CHART_COLORS[i % CHART_COLORS.length];
    });
    return map;
  }, [companies]);

  function updateUrl(nextSymbols: string[], nextColumnKeys: string[]) {
    const params = new URLSearchParams();
    if (nextSymbols.length > 0) params.set("symbols", nextSymbols.join(","));
    if (!sameKeySet(nextColumnKeys, COMPARE_DEFAULT_COLUMN_KEYS)) {
      params.set("cols", nextColumnKeys.join(","));
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function handleAdd(symbol: string) {
    if (symbols.includes(symbol) || symbols.length >= MAX_COMPANIES) return;
    updateUrl([...symbols, symbol], columnKeys);
  }

  function handleRemove(symbol: string) {
    updateUrl(
      symbols.filter((s) => s !== symbol),
      columnKeys
    );
  }

  function handleColumnChange(keys: string[]) {
    updateUrl(symbols, keys);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compare Stocks</h1>
        <p className="text-sm text-muted-foreground">
          Pick up to {MAX_COMPANIES} companies and compare them side by side.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {symbols.map((symbol) => {
          const company = companies.find((c) => c.symbol === symbol);
          return (
            <Badge key={symbol} variant="outline" className="gap-1 py-1 pr-1">
              {company?.name ?? symbol}
              <button
                onClick={() => handleRemove(symbol)}
                className="rounded-full p-0.5 hover:bg-muted"
                aria-label={`Remove ${company?.name ?? symbol}`}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          );
        })}
        <CompanyPickerDialog selectedSymbols={symbols} onAdd={handleAdd} />
        {symbols.length > 0 && (
          <>
            <span className="text-xs text-muted-foreground">
              {symbols.length} / {MAX_COMPANIES}
            </span>
            <Button variant="ghost" size="sm" onClick={handleCopyLink}>
              <LinkIcon />
              Copy link
            </Button>
          </>
        )}
      </div>

      {symbols.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-12 text-center">
          <GitCompareArrows className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Pick up to {MAX_COMPANIES} companies to compare side by side.
          </p>
        </div>
      )}

      {loading && (
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </div>
      )}

      {!loading && error && companies.length === 0 && (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">
            {extractErrorMessage(error, "Failed to fetch comparison data")}
          </p>
        </div>
      )}

      {!loading && companies.length > 0 && (
        <div className="space-y-4">
          <CompanyColorLegend companies={companies} colorMap={colorMap} />
          <StatementSection
            title="Comparison"
            actions={
              <PeerColumnEditor
                selectedKeys={columnKeys}
                onChange={handleColumnChange}
                resetKeys={COMPARE_DEFAULT_COLUMN_KEYS}
              />
            }
            table={<PeerComparisonTable companies={companies} columns={columns} />}
            dashboard={<CompareDashboard companies={companies} columns={columns} colorMap={colorMap} />}
          />
        </div>
      )}
    </div>
  );
}

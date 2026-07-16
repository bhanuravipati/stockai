"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { FinancialTable, type RowDef, type StatementRow } from "@/components/company/financial-table";
import { StatementSection } from "@/components/company/statement-section";
import { BalanceSheetDashboard } from "@/components/company/balance-sheet-dashboard";

interface BalanceSheet {
  date: string;
  periodType?: "annual" | "quarterly";
  totalAssets?: number;
  totalLiabilities?: number;
  stockholdersEquity?: number;
  currentAssets?: number;
  cashAndCashEquivalents?: number;
  inventory?: number;
  accountsReceivable?: number;
  netPPE?: number;
  totalNonCurrentAssets?: number;
  currentLiabilities?: number;
  accountsPayable?: number;
  longTermDebt?: number;
  totalDebt?: number;
  totalNonCurrentLiabilities?: number;
  retainedEarnings?: number;
  commonStockEquity?: number;
  workingCapital?: number;
  netDebt?: number;
  tangibleBookValue?: number;
  investedCapital?: number;
  totalCapitalization?: number;
  minorityInterest?: number;
}

const ROWS: RowDef[] = [
  { key: "totalAssets", label: "Total Assets", emphasis: true },
  { key: "currentAssets", label: "Current Assets" },
  { key: "cashAndCashEquivalents", label: "Cash & Cash Equivalents" },
  { key: "inventory", label: "Inventory" },
  { key: "accountsReceivable", label: "Accounts Receivable" },
  { key: "netPPE", label: "Net Property, Plant & Equipment" },
  { key: "totalNonCurrentAssets", label: "Total Non-Current Assets" },
  { key: "totalLiabilities", label: "Total Liabilities", emphasis: true },
  { key: "currentLiabilities", label: "Current Liabilities" },
  { key: "accountsPayable", label: "Accounts Payable" },
  { key: "longTermDebt", label: "Long Term Debt" },
  { key: "totalDebt", label: "Total Debt" },
  { key: "totalNonCurrentLiabilities", label: "Total Non-Current Liabilities" },
  { key: "stockholdersEquity", label: "Stockholders' Equity", emphasis: true },
  { key: "retainedEarnings", label: "Retained Earnings" },
  { key: "commonStockEquity", label: "Common Stock Equity" },
  { key: "minorityInterest", label: "Minority Interest" },
  { key: "workingCapital", label: "Working Capital" },
  { key: "netDebt", label: "Net Debt" },
  { key: "tangibleBookValue", label: "Tangible Book Value" },
  { key: "investedCapital", label: "Invested Capital" },
  { key: "totalCapitalization", label: "Total Capitalization" },
];

export default function BalanceSheetPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const [symbol, setSymbol] = useState<string>("");
  const [statements, setStatements] = useState<BalanceSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function loadParams() {
      const { symbol: sym } = await params;
      setSymbol(sym);
      fetchData(sym);
    }
    loadParams();
  }, [params]);

  async function fetchData(sym: string) {
    try {
      const res = await fetch(`/api/companies/${sym}/balance-sheet`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch balance sheet");
      }
      const data = await res.json();
      setStatements(data.statements || []);
      setRefreshing(data.refreshing || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Balance Sheet</h2>
        <p className="text-muted-foreground text-red-500">{error}</p>
      </div>
    );
  }

  if (statements.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Balance Sheet</h2>
        <p className="text-muted-foreground">
          {refreshing
            ? "Data is being synced from Yahoo Finance... Please refresh in a moment."
            : `No balance sheet data available for ${symbol}`}
        </p>
      </div>
    );
  }

  const rows = statements.map((stmt) => ({
    ...stmt,
    periodLabel: format(new Date(stmt.date), "MMM yyyy"),
  }));

  return (
    <div className="space-y-6">
      <StatementSection
        title="Balance Sheet"
        table={<FinancialTable statements={rows as StatementRow[]} rows={ROWS} />}
        dashboard={<BalanceSheetDashboard statements={rows} />}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { FinancialTable, type RowDef, type StatementRow } from "@/components/company/financial-table";
import { StatementSection } from "@/components/company/statement-section";
import { ProfitLossDashboard } from "@/components/company/profit-loss-dashboard";

interface IncomeStatement {
  date: string;
  periodType?: "annual" | "quarterly";
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  costOfRevenue?: number;
  operatingExpense?: number;
  sellingGeneralAndAdministration?: number;
  ebitda?: number;
  ebit?: number;
  normalizedEbitda?: number;
  normalizedIncome?: number;
  interestIncome?: number;
  interestExpense?: number;
  netInterestIncome?: number;
  taxProvision?: number;
  pretaxIncome?: number;
  taxRateForCalcs?: number;
  dilutedEps?: number;
  basicEps?: number;
  dilutedAverageShares?: number;
  basicAverageShares?: number;
  totalUnusualItems?: number;
  totalExpenses?: number;
  netIncomeCommonStockholders?: number;
}

const ROWS: RowDef[] = [
  { key: "revenue", label: "Total Revenue", emphasis: true },
  { key: "costOfRevenue", label: "Cost Of Revenue" },
  { key: "grossProfit", label: "Gross Profit", emphasis: true },
  { key: "operatingExpense", label: "Operating Expense" },
  { key: "sellingGeneralAndAdministration", label: "Selling, General & Admin" },
  { key: "operatingIncome", label: "Operating Income", emphasis: true },
  { key: "interestIncome", label: "Interest Income" },
  { key: "interestExpense", label: "Interest Expense" },
  { key: "netInterestIncome", label: "Net Interest Income" },
  { key: "totalUnusualItems", label: "Total Unusual Items" },
  { key: "pretaxIncome", label: "Pretax Income", emphasis: true },
  { key: "taxProvision", label: "Tax Provision" },
  { key: "taxRateForCalcs", label: "Effective Tax Rate", format: "percent" },
  { key: "netIncome", label: "Net Income", emphasis: true },
  { key: "netIncomeCommonStockholders", label: "Net Income to Common Stockholders" },
  { key: "ebit", label: "EBIT" },
  { key: "ebitda", label: "EBITDA", emphasis: true },
  { key: "normalizedEbitda", label: "Normalized EBITDA" },
  { key: "normalizedIncome", label: "Normalized Income" },
  { key: "totalExpenses", label: "Total Expenses" },
  { key: "basicEps", label: "Basic EPS (₹)", format: "eps" },
  { key: "dilutedEps", label: "Diluted EPS (₹)", format: "eps" },
  { key: "basicAverageShares", label: "Basic Average Shares", format: "shares" },
  { key: "dilutedAverageShares", label: "Diluted Average Shares", format: "shares" },
];

export default function ProfitLossPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const [symbol, setSymbol] = useState<string>("");
  const [statements, setStatements] = useState<IncomeStatement[]>([]);
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
      const res = await fetch(`/api/companies/${sym}/income-statement`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch income statement");
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
        <h2 className="mb-4 text-lg font-semibold">Profit & Loss Statement</h2>
        <p className="text-muted-foreground text-red-500">{error}</p>
      </div>
    );
  }

  if (statements.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Profit & Loss Statement</h2>
        <p className="text-muted-foreground">
          {refreshing
            ? "Data is being synced from Yahoo Finance... Please refresh in a moment."
            : `No income statement data available for ${symbol}`}
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
        title="Profit & Loss Statement"
        table={<FinancialTable statements={rows as StatementRow[]} rows={ROWS} />}
        dashboard={<ProfitLossDashboard statements={rows} />}
      />
    </div>
  );
}

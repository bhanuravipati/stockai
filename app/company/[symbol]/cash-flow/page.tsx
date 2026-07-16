"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { FinancialTable, type RowDef, type StatementRow } from "@/components/company/financial-table";
import { StatementSection } from "@/components/company/statement-section";
import { CashFlowDashboard } from "@/components/company/cash-flow-dashboard";

interface CashFlowStatement {
  date: string;
  periodType?: "annual" | "quarterly";
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  freeCashFlow?: number;
  capitalExpenditure?: number;
  endCashPosition?: number;
  beginningCashPosition?: number;
  changesInCash?: number;
  repurchaseOfCapitalStock?: number;
  issuanceOfCapitalStock?: number;
  cashDividendsPaid?: number;
  repaymentOfDebt?: number;
  issuanceOfDebt?: number;
  depreciationAndAmortization?: number;
  stockBasedCompensation?: number;
  changeInWorkingCapital?: number;
  interestPaidSupplementalData?: number;
  incomeTaxPaidSupplementalData?: number;
}

const ROWS: RowDef[] = [
  { key: "operatingCashFlow", label: "Operating Cash Flow", emphasis: true },
  { key: "investingCashFlow", label: "Investing Cash Flow", emphasis: true },
  { key: "financingCashFlow", label: "Financing Cash Flow", emphasis: true },
  { key: "freeCashFlow", label: "Free Cash Flow", emphasis: true },
  { key: "capitalExpenditure", label: "Capital Expenditure" },
  { key: "depreciationAndAmortization", label: "Depreciation & Amortization" },
  { key: "stockBasedCompensation", label: "Stock Based Compensation" },
  { key: "changeInWorkingCapital", label: "Change in Working Capital" },
  { key: "repurchaseOfCapitalStock", label: "Repurchase of Capital Stock" },
  { key: "issuanceOfCapitalStock", label: "Issuance of Capital Stock" },
  { key: "cashDividendsPaid", label: "Cash Dividends Paid" },
  { key: "repaymentOfDebt", label: "Repayment of Debt" },
  { key: "issuanceOfDebt", label: "Issuance of Debt" },
  { key: "beginningCashPosition", label: "Beginning Cash Position" },
  { key: "endCashPosition", label: "Ending Cash Position", emphasis: true },
  { key: "changesInCash", label: "Change in Cash" },
  { key: "interestPaidSupplementalData", label: "Interest Paid" },
  { key: "incomeTaxPaidSupplementalData", label: "Income Tax Paid" },
];

export default function CashFlowPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const [symbol, setSymbol] = useState<string>("");
  const [statements, setStatements] = useState<CashFlowStatement[]>([]);
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
      const res = await fetch(`/api/companies/${sym}/cash-flow`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch cash flow statement");
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
        <h2 className="mb-4 text-lg font-semibold">Cash Flow Statement</h2>
        <p className="text-muted-foreground text-red-500">{error}</p>
      </div>
    );
  }

  if (statements.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Cash Flow Statement</h2>
        <p className="text-muted-foreground">
          {refreshing
            ? "Data is being synced from Yahoo Finance... Please refresh in a moment."
            : `No cash flow data available for ${symbol}`}
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
        title="Cash Flow Statement"
        table={<FinancialTable statements={rows as StatementRow[]} rows={ROWS} />}
        dashboard={<CashFlowDashboard statements={rows} />}
      />
    </div>
  );
}

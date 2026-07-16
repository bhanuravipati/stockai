import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { triggerScrape } from "@/lib/ai-service-client";
import { getCashFlow } from "@/lib/yfinance";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    console.log(`[/api/cash-flow] Fetching for symbol: ${symbol}`);

    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    const cached = company
      ? await prisma.financialStatement.findMany({
          where: { companyId: company.id },
          orderBy: { periodEndDate: "asc" },
        })
      : [];

    if (cached.length > 0) {
      const statements = cached.map((stmt) => ({
        date: stmt.periodEndDate.toISOString().split("T")[0],
        periodType: stmt.periodType === "ANNUAL" ? ("annual" as const) : ("quarterly" as const),
        operatingCashFlow: stmt.operatingCashFlow ?? undefined,
        investingCashFlow: stmt.investingCashFlow ?? undefined,
        financingCashFlow: stmt.financingCashFlow ?? undefined,
        freeCashFlow: stmt.freeCashFlow ?? undefined,
        capitalExpenditure: stmt.capitalExpenditure ?? undefined,
        endCashPosition: stmt.endCashPosition ?? undefined,
        beginningCashPosition: stmt.beginningCashPosition ?? undefined,
        changesInCash: stmt.changesInCash ?? undefined,
        repurchaseOfCapitalStock: stmt.repurchaseOfCapitalStock ?? undefined,
        issuanceOfCapitalStock: stmt.issuanceOfCapitalStock ?? undefined,
        cashDividendsPaid: stmt.cashDividendsPaid ?? undefined,
        repaymentOfDebt: stmt.repaymentOfDebt ?? undefined,
        issuanceOfDebt: stmt.issuanceOfDebt ?? undefined,
        depreciationAndAmortization: stmt.depreciationAndAmortization ?? undefined,
        stockBasedCompensation: stmt.stockBasedCompensation ?? undefined,
        changeInWorkingCapital: stmt.changeInWorkingCapital ?? undefined,
        interestPaidSupplementalData: stmt.interestPaidSupplementalData ?? undefined,
        incomeTaxPaidSupplementalData: stmt.incomeTaxPaidSupplementalData ?? undefined,
      }));
      return NextResponse.json({ statements });
    }

    // No cached data yet — fetch live from Yahoo Finance so the tab isn't blank,
    // and trigger an async backfill for next time.
    if (company) {
      triggerScrape(symbol, "financials");
    }

    const exchange = company?.exchange || (symbol.includes(".") ? undefined : "NSE");
    const statements = await getCashFlow(symbol, exchange);

    return NextResponse.json({ statements, refreshing: statements.length === 0 });
  } catch (error) {
    console.error("[/api/cash-flow] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

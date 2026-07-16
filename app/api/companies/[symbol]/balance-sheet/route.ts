import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { triggerScrape } from "@/lib/ai-service-client";
import { getBalanceSheet } from "@/lib/yfinance";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    console.log(`[/api/balance-sheet] Fetching for symbol: ${symbol}`);

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
        totalAssets: stmt.totalAssets ?? undefined,
        totalLiabilities: stmt.totalLiabilities ?? undefined,
        stockholdersEquity: stmt.stockholdersEquity ?? undefined,
        currentAssets: stmt.currentAssets ?? undefined,
        cashAndCashEquivalents: stmt.cashAndCashEquivalents ?? undefined,
        inventory: stmt.inventory ?? undefined,
        accountsReceivable: stmt.accountsReceivable ?? undefined,
        netPPE: stmt.netPPE ?? undefined,
        totalNonCurrentAssets: stmt.totalNonCurrentAssets ?? undefined,
        currentLiabilities: stmt.currentLiabilities ?? undefined,
        accountsPayable: stmt.accountsPayable ?? undefined,
        longTermDebt: stmt.longTermDebt ?? undefined,
        totalDebt: stmt.totalDebt ?? undefined,
        totalNonCurrentLiabilities: stmt.totalNonCurrentLiabilities ?? undefined,
        retainedEarnings: stmt.retainedEarnings ?? undefined,
        commonStockEquity: stmt.commonStockEquity ?? undefined,
        workingCapital: stmt.workingCapital ?? undefined,
        netDebt: stmt.netDebt ?? undefined,
        tangibleBookValue: stmt.tangibleBookValue ?? undefined,
        investedCapital: stmt.investedCapital ?? undefined,
        totalCapitalization: stmt.totalCapitalization ?? undefined,
        minorityInterest: stmt.minorityInterest ?? undefined,
      }));
      return NextResponse.json({ statements });
    }

    // No cached data yet — fetch live from Yahoo Finance so the tab isn't blank,
    // and trigger an async backfill for next time.
    if (company) {
      triggerScrape(symbol, "financials");
    }

    const exchange = company?.exchange || (symbol.includes(".") ? undefined : "NSE");
    const statements = await getBalanceSheet(symbol, exchange);

    return NextResponse.json({ statements, refreshing: statements.length === 0 });
  } catch (error) {
    console.error("[/api/balance-sheet] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

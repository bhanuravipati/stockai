import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { triggerScrape } from "@/lib/ai-service-client";
import { getIncomeStatement } from "@/lib/yfinance";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    console.log(`[/api/income-statement] Fetching for symbol: ${symbol}`);

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
        revenue: stmt.revenue ?? undefined,
        grossProfit: stmt.grossProfit ?? undefined,
        operatingIncome: stmt.operatingIncome ?? undefined,
        netIncome: stmt.netIncome ?? undefined,
        costOfRevenue: stmt.costOfRevenue ?? undefined,
        operatingExpense: stmt.operatingExpense ?? undefined,
        sellingGeneralAndAdministration: stmt.sellingGeneralAndAdministration ?? undefined,
        ebitda: stmt.ebitda ?? undefined,
        ebit: stmt.ebit ?? undefined,
        normalizedEbitda: stmt.normalizedEbitda ?? undefined,
        normalizedIncome: stmt.normalizedIncome ?? undefined,
        interestIncome: stmt.interestIncome ?? undefined,
        interestExpense: stmt.interestExpense ?? undefined,
        netInterestIncome: stmt.netInterestIncome ?? undefined,
        taxProvision: stmt.taxProvision ?? undefined,
        pretaxIncome: stmt.pretaxIncome ?? undefined,
        taxRateForCalcs: stmt.taxRateForCalcs ?? undefined,
        dilutedEps: stmt.dilutedEps ?? undefined,
        basicEps: stmt.basicEps ?? undefined,
        dilutedAverageShares: stmt.dilutedAverageShares ?? undefined,
        basicAverageShares: stmt.basicAverageShares ?? undefined,
        totalUnusualItems: stmt.totalUnusualItems ?? undefined,
        totalExpenses: stmt.totalExpenses ?? undefined,
        netIncomeCommonStockholders: stmt.netIncomeCommonStockholders ?? undefined,
      }));
      return NextResponse.json({ statements });
    }

    // No cached data yet — fetch live from Yahoo Finance so the tab isn't blank,
    // and trigger an async backfill for next time.
    if (company) {
      triggerScrape(symbol, "financials");
    }

    const exchange = company?.exchange || (symbol.includes(".") ? undefined : "NSE");
    const statements = await getIncomeStatement(symbol, exchange);

    return NextResponse.json({ statements, refreshing: statements.length === 0 });
  } catch (error) {
    console.error("[/api/income-statement] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

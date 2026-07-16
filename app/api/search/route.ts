import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchStocks } from "@/lib/yfinance";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) return NextResponse.json({ results: [] });

  try {
    // First: Search in persistent database (Company master list)
    const dbResults = await prisma.company.findMany({
      where: {
        OR: [
          { symbol: { contains: q.toUpperCase(), mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { sector: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
    });

    // Map database results to search result format
    const results = dbResults.map((company) => ({
      symbol: company.symbol,
      name: company.name,
      exchange: company.exchange as "NSE" | "BSE" | "BOTH",
      sector: company.sector,
      logoUrl: null, // TODO: add logo URLs later
      type: "Equity",
    }));

    // If we got good results from DB, return them
    if (results.length > 0) {
      return NextResponse.json({ results });
    }

    // Fallback: Search via Yahoo Finance API for new symbols not in our DB
    console.log(`[search] DB found ${results.length} results, trying Yahoo Finance API`);
    try {
      const liveResults = await searchStocks(q);
      // Ensure fallback results have the required fields
      const mappedLiveResults = liveResults.map((result: any) => ({
        symbol: result.symbol,
        name: result.name,
        exchange: result.exchange || "NSE",
        sector: null,
        logoUrl: null,
        type: result.type || "Equity",
      }));
      return NextResponse.json({ results: mappedLiveResults });
    } catch (liveError) {
      // If both fail, return empty results gracefully
      console.error("Yahoo Finance search also failed:", liveError);
      return NextResponse.json({ results: [] });
    }
  } catch (error) {
    console.error("Search error:", error);
    // Return DB results if we had any, even on error
    return NextResponse.json(
      { results: [], error: "Search encountered an issue" },
      { status: 200 }
    );
  }
}

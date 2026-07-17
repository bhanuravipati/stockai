import { NextRequest, NextResponse } from "next/server";
import { getCompaniesBySector } from "@/lib/yfinance";
import { getIndustrySector } from "@/lib/industry-sectors";

const PAGE_SIZE = 30;

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("sector") ?? "";
  const pageParam = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;

  const sector = getIndustrySector(slug);
  if (!sector) {
    return NextResponse.json({ error: `Unknown sector "${slug}"` }, { status: 400 });
  }

  try {
    const result = await getCompaniesBySector(sector.yahooSector, page, PAGE_SIZE);
    return NextResponse.json({
      sector: sector.key,
      label: sector.label,
      companies: result.companies,
      count: result.companies.length,
      page: result.page,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error(`[/api/companies/industry] Error for sector=${slug}:`, error);
    return NextResponse.json(
      { error: "Sector data is temporarily unavailable — Yahoo's screener endpoint failed. Try again shortly." },
      { status: 502 }
    );
  }
}

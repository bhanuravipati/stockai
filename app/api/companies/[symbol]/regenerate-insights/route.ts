import { NextRequest, NextResponse } from "next/server";

// Phase 1 stub: the ai-service (LangGraph + Groq pipeline, see /ai-service) isn't
// wired up yet, so this route just acknowledges the request. Once ai-service is
// live (Phase 3), this should proxy to `POST {AI_SERVICE_URL}/regenerate-insights`
// and, on success, revalidate the company's SWOT/dashboard pages.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  await new Promise((resolve) => setTimeout(resolve, 900));

  return NextResponse.json({
    ok: true,
    stub: true,
    symbol,
    message:
      "AI service not yet connected — this is placeholder seed data. Live regeneration lands in Phase 3.",
  });
}

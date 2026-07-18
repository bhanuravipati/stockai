import { NextRequest, NextResponse } from "next/server";
import { refreshUniverse, type RefreshMode } from "@/lib/screener-universe";

// A full refresh fans out ~500 quoteSummary calls (plus discovery + batch
// quotes) — comfortably 1-3 minutes. Same Vercel caveat as the screen route:
// Hobby-tier caps duration at 60s regardless of this value.
export const maxDuration = 300;

const MODES: RefreshMode[] = ["full", "quotes", "growth"];

/**
 * POST /api/admin/refresh-universe?mode=full|quotes|growth[&includeGrowth=1]
 * Refreshes the ScreenerMetric snapshot. Cron-triggered from ai-service's
 * scheduler; also run manually once to bootstrap an empty table
 * (`mode=full&includeGrowth=1`). Gated exactly like /api/admin/seed-companies:
 * set ADMIN_SEED_SECRET and pass it as `x-admin-secret` — left open when the
 * env var is unset so local dev is unaffected.
 */
export async function POST(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SEED_SECRET;
  if (adminSecret && request.headers.get("x-admin-secret") !== adminSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const modeParam = request.nextUrl.searchParams.get("mode") ?? "full";
  if (!MODES.includes(modeParam as RefreshMode)) {
    return NextResponse.json(
      { ok: false, error: `Unknown mode "${modeParam}" — expected one of: ${MODES.join(", ")}` },
      { status: 400 }
    );
  }
  const includeGrowth = request.nextUrl.searchParams.get("includeGrowth") === "1";

  try {
    console.log(`[refresh-universe] Starting mode=${modeParam}${includeGrowth ? " (with growth)" : ""}...`);
    const result = await refreshUniverse(modeParam as RefreshMode, { includeGrowth });
    console.log(`[refresh-universe] ✓`, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[refresh-universe] ✗ mode=${modeParam} failed:`, error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 502 }
    );
  }
}

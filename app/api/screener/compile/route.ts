import { NextRequest, NextResponse } from "next/server";
import { compileScreen } from "@/lib/screener";

const MAX_QUERY_LENGTH = 500;

/**
 * Server-to-server validation endpoint for the screener agent (ai-service) —
 * lets the query compiler stay TypeScript-only instead of being ported to
 * Python. Always responds 200; validity is carried in the body so the agent
 * can distinguish "your query is invalid" from "the request itself failed".
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: { message: "Invalid JSON body", start: 0, end: 0 } });
  }

  const query = typeof body === "object" && body !== null && "query" in body ? (body as { query: unknown }).query : undefined;
  if (typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ ok: false, error: { message: "No query provided", start: 0, end: 0 } });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({
      ok: false,
      error: { message: `Query is too long (max ${MAX_QUERY_LENGTH} characters)`, start: 0, end: query.length },
    });
  }

  const compiled = compileScreen(query);
  if (!compiled.ok) {
    return NextResponse.json({
      ok: false,
      error: { message: compiled.error.message, start: compiled.error.start, end: compiled.error.end },
    });
  }

  return NextResponse.json({
    ok: true,
    metricKeys: compiled.plan.metricKeys,
    sector: compiled.plan.sector?.key,
  });
}

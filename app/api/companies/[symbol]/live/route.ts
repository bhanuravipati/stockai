import { NextRequest } from "next/server";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Proxies ai-service's Angel One SSE tick stream through to the browser.
 * Keeps the existing boundary where the browser only ever talks to the
 * Next.js origin, never directly to ai-service. Passes through ai-service's
 * status as-is (404 when the symbol isn't being live-streamed) so the
 * client hook can fall back to the static quote already on the page.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;

  if (!/^[A-Za-z0-9.&-]+$/.test(symbol)) {
    return new Response("Invalid symbol", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${AI_SERVICE_URL}/stream/${encodeURIComponent(symbol)}`, {
      headers: { Accept: "text/event-stream" },
      signal: request.signal,
    });
  } catch {
    return new Response("ai-service unreachable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(await upstream.text(), { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

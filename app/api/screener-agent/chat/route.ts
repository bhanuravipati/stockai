import { NextRequest } from "next/server";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// LLM turns (clarify/compose/validate, occasionally with a self-correction
// retry) are slower than a typical API route — give the stream room to
// finish rather than timing out mid-conversation.
export const maxDuration = 60;

/**
 * Proxies the screener agent's chat SSE stream through to the browser — a
 * dumb pass-through (never rewrites events), same boundary as the existing
 * live-quote proxy: the browser only ever talks to the Next.js origin.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${AI_SERVICE_URL}/screener-agent/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify(body),
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

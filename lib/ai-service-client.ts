/**
 * Fire-and-forget triggers for background data sync jobs in ai-service.
 * Never awaited — used to trigger backfills without blocking the request.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export async function triggerScrape(
  symbol: string,
  job: "quote" | "history" | "financials" | "ratios" | "news"
): Promise<void> {
  try {
    const url = new URL(`${AI_SERVICE_URL}/scrape/run`);
    url.searchParams.append("company", symbol);
    url.searchParams.append("job", job);

    // Fire-and-forget: don't await, don't handle errors
    fetch(url.toString(), { method: "POST" }).catch(() => {
      // Silently ignore failures — data will be missing but request isn't blocked
    });
  } catch (error) {
    // Silently ignore errors in URL construction or fetch setup
  }
}

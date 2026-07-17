/**
 * Shared SWR fetcher for this app's API routes. SWR keys requests by URL and
 * caches/dedupes/revalidates around that cache automatically — this is what
 * replaces the "every tab revisit is a full uncached refetch" pattern the
 * raw `useEffect` + `fetch` calls had (switching Overview -> P&L -> Overview
 * now shows the cached result instantly instead of a fresh skeleton).
 */
export class FetchError extends Error {
  info?: unknown;
  status?: number;
}

export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new FetchError(`Request to ${url} failed with ${res.status}`);
    error.status = res.status;
    try {
      error.info = await res.json();
    } catch {
      // Response body wasn't JSON — leave `info` undefined.
    }
    throw error;
  }
  return res.json();
}

/** Pulls the API's own `{ error: "..." }` message out of a thrown FetchError, matching this app's routes. */
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof FetchError && error.info && typeof error.info === "object" && "error" in error.info) {
    const message = (error.info as { error?: unknown }).error;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}
